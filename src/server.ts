import 'dotenv/config';
import cors from 'cors';
import express, { type Request, type Response } from 'express';
import crypto from 'crypto';
import { MongoClient, type Collection, type Document } from 'mongodb';
import path from 'path';

const app = express();
const port = Number(process.env.PORT) || 3001;
const publicDir = path.resolve(process.cwd(), 'public');
const adminUsername = process.env.ADMIN_USERNAME;
const adminPassword = process.env.ADMIN_PASSWORD;
const mongoUri = process.env.MONGODB_URI;
const mongoDbName = process.env.MONGODB_DB || 'tv_display';
const mongoCollectionName = process.env.MONGODB_COLLECTION || 'metrics';
const metricsDocumentId = 'dashboard-metrics';
const mongoClient = mongoUri ? new MongoClient(mongoUri) : null;
const authSecret = process.env.AUTH_SECRET || `${adminUsername ?? ''}:${adminPassword ?? ''}`;
const tokenTtlMs = 24 * 60 * 60 * 1000;
const isVercel = process.env.VERCEL === '1';

type MetricsPayload = Record<string, unknown>;

type MetricsDocument = Document & {
  _id: string;
  payload: MetricsPayload;
  updatedAt: Date;
};

type AuthTokenPayload = {
  sub: string;
  exp: number;
};

let metricsCollection: Collection<MetricsDocument> | null = null;

app.use(cors());
app.use(express.json());
app.use(express.static(publicDir));

app.get('/', (_request: Request, response: Response) => {
  response.sendFile(path.join(publicDir, 'index.html'));
});

app.get('/admin', (_request: Request, response: Response) => {
  response.sendFile(path.join(publicDir, 'admin.html'));
});

app.get('/.well-known/appspecific/com.chrome.devtools.json', (_request: Request, response: Response) => {
  response.status(204).end();
});

function requireAuthConfig(): void {
  if (!adminUsername || !adminPassword) {
    throw new Error('Set ADMIN_USERNAME and ADMIN_PASSWORD in .env before starting the server.');
  }
}

function requireMongoConfig(): void {
  if (!mongoUri) {
    throw new Error('Set MONGODB_URI in .env before starting the server.');
  }
}

function base64UrlEncode(input: string): string {
  return Buffer.from(input, 'utf8').toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

function base64UrlDecode(input: string): string {
  const normalized = input.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4);
  return Buffer.from(padded, 'base64').toString('utf8');
}

function signTokenPayload(payload: AuthTokenPayload): string {
  return crypto.createHmac('sha256', authSecret).update(JSON.stringify(payload)).digest('base64url');
}

function issueAuthToken(username: string): string {
  const payload: AuthTokenPayload = {
    sub: username,
    exp: Date.now() + tokenTtlMs,
  };

  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const signature = signTokenPayload(payload);

  return `${encodedPayload}.${signature}`;
}

function verifyAuthToken(token: string): boolean {
  const [encodedPayload, signature] = token.split('.');

  if (!encodedPayload || !signature) {
    return false;
  }

  try {
    const payload = JSON.parse(base64UrlDecode(encodedPayload)) as AuthTokenPayload;

    if (!payload.sub || !payload.exp || payload.exp < Date.now()) {
      return false;
    }

    const expectedSignature = signTokenPayload(payload);
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
  } catch {
    return false;
  }
}

app.post('/api/login', (request: Request, response: Response) => {
  if (!adminUsername || !adminPassword) {
    response.status(500).json({ message: 'Authentication is not configured.' });
    return;
  }

  const { username, password } = request.body as { username?: string; password?: string };

  if (username !== adminUsername || password !== adminPassword) {
    response.status(401).json({ message: 'Invalid username or password.' });
    return;
  }

  const token = issueAuthToken(username);

  response.json({ token });
});

function getBearerToken(request: Request): string | null {
  const authorization = request.headers.authorization;

  if (!authorization?.startsWith('Bearer ')) {
    return null;
  }

  return authorization.slice('Bearer '.length).trim();
}

function requireAuth(request: Request, response: Response): boolean {
  const token = getBearerToken(request);

  if (!token || !verifyAuthToken(token)) {
    response.status(401).json({ message: 'Unauthorized.' });
    return false;
  }

  return true;
}

async function getMetricsCollection(): Promise<Collection<MetricsDocument>> {
  if (metricsCollection) {
    return metricsCollection;
  }

  requireMongoConfig();

  if (!mongoClient) {
    throw new Error('MongoDB client is not configured.');
  }

  await mongoClient.connect();
  metricsCollection = mongoClient.db(mongoDbName).collection<MetricsDocument>(mongoCollectionName);
  return metricsCollection;
}

async function ensureAppConfiguration(): Promise<void> {
  requireAuthConfig();
  requireMongoConfig();

  try {
    await getMetricsCollection();
  } catch (error) {
    throw new Error(`Failed to connect to MongoDB Atlas: ${(error as Error).message}`);
  }
}

async function readMetrics(): Promise<MetricsPayload> {
  const collection = await getMetricsCollection();
  const document = await collection.findOne({ _id: metricsDocumentId });
  return document?.payload ?? {};
}

async function writeMetrics(payload: MetricsPayload): Promise<void> {
  const collection = await getMetricsCollection();

  await collection.updateOne(
    { _id: metricsDocumentId },
    {
      $set: {
        payload,
        updatedAt: new Date(),
      },
    },
    { upsert: true },
  );
}

app.get('/api/metrics', async (_request: Request, response: Response) => {
  try {
    const metrics = await readMetrics();
    response.json(metrics);
  } catch (error) {
    console.error('Failed to read metrics:', error);
    response.status(500).json({
      message: 'Unable to read metrics data right now.',
    });
  }
});

app.post('/api/metrics', async (request: Request, response: Response) => {
  if (!requireAuth(request, response)) {
    return;
  }

  if (!request.body || typeof request.body !== 'object' || Array.isArray(request.body)) {
    response.status(400).json({ message: 'Expected a JSON object.' });
    return;
  }

  try {
    await writeMetrics(request.body as MetricsPayload);
    response.status(200).json({
      success: true,
    });
  } catch (error) {
    console.error('Failed to write metrics:', error);
    response.status(500).json({
      message: 'Unable to save metrics data right now.',
    });
  }
});

app.use((error: unknown, _request: Request, response: Response, next: (error?: unknown) => void) => {
  if (error instanceof SyntaxError && 'body' in error) {
    response.status(400).json({ message: 'Invalid JSON payload.' });
    return;
  }

  next(error);
});

async function startServer(): Promise<void> {
  await ensureAppConfiguration();

  const listen = (currentPort: number): Promise<void> =>
    new Promise((resolve, reject) => {
      const server = app.listen(currentPort, '0.0.0.0', () => {
        console.log(`TV dashboard API listening on http://0.0.0.0:${currentPort}`);
        resolve();
      });

      server.on('error', (error: NodeJS.ErrnoException) => {
        if (error.code === 'EADDRINUSE') {
          console.warn(`Port ${currentPort} is busy, trying ${currentPort + 1}...`);
          server.close(() => {
            listen(currentPort + 1).then(resolve).catch(reject);
          });
          return;
        }

        reject(error);
      });
    });

  await listen(port);
}

export default app;

if (!isVercel && require.main === module) {
  startServer().catch((error) => {
    console.error('Failed to start server:', error);
    process.exit(1);
  });
}