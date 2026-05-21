import 'dotenv/config';
import cors from 'cors';
import express, { type Request, type Response } from 'express';
import crypto from 'crypto';
import { promises as fs } from 'fs';
import path from 'path';

const app = express();
const port = Number(process.env.PORT) || 3001;
const dataFilePath = path.resolve(process.cwd(), 'data.json');
const publicDir = path.resolve(process.cwd(), 'public');
const adminUsername = process.env.ADMIN_USERNAME;
const adminPassword = process.env.ADMIN_PASSWORD;
const jsonBinBinId = process.env.JSONBIN_BIN_ID?.trim();
const jsonBinApiKey = process.env.JSONBIN_API_KEY?.trim();
const jsonBinBaseUrl = 'https://api.jsonbin.io/v3';
const activeTokens = new Set<string>();

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

function isUsingJsonBin(): boolean {
  return Boolean(jsonBinBinId);
}

function getJsonBinUrl(): string {
  if (!jsonBinBinId) {
    throw new Error('Set JSONBIN_BIN_ID in .env before starting the server.');
  }

  return `${jsonBinBaseUrl}/b/${jsonBinBinId}`;
}

function getJsonBinHeaders(includeContentType = false): Record<string, string> {
  const headers: Record<string, string> = {};

  if (includeContentType) {
    headers['Content-Type'] = 'application/json';
  }

  if (jsonBinApiKey) {
    headers['X-Master-Key'] = jsonBinApiKey;
  }

  return headers;
}

async function readJsonBinError(response: globalThis.Response): Promise<string> {
  try {
    const body = (await response.json()) as { message?: string };
    return body.message || response.statusText || `Request failed (${response.status}).`;
  } catch {
    return response.statusText || `Request failed (${response.status}).`;
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

  const token = crypto.randomBytes(24).toString('hex');
  activeTokens.add(token);

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

  if (!token || !activeTokens.has(token)) {
    response.status(401).json({ message: 'Unauthorized.' });
    return false;
  }

  return true;
}

async function ensureAppConfiguration(): Promise<void> {
  requireAuthConfig();

  if (!isUsingJsonBin()) {
    try {
      await fs.access(dataFilePath);
    } catch (error) {
      throw new Error(`data.json is missing or unreadable: ${(error as Error).message}`);
    }
  }
}

async function readMetrics(): Promise<unknown> {
  if (isUsingJsonBin()) {
    const response = await fetch(`${getJsonBinUrl()}/latest?meta=false`, {
      headers: getJsonBinHeaders(),
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(await readJsonBinError(response));
    }

    return response.json();
  }

  const raw = await fs.readFile(dataFilePath, 'utf8');
  return JSON.parse(raw);
}

async function writeMetrics(payload: unknown): Promise<void> {
  if (isUsingJsonBin()) {
    if (!jsonBinApiKey) {
      throw new Error('Set JSONBIN_API_KEY in .env to save data to JSONBin.');
    }

    const response = await fetch(getJsonBinUrl(), {
      method: 'PUT',
      headers: getJsonBinHeaders(true),
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(await readJsonBinError(response));
    }

    return;
  }

  await fs.writeFile(dataFilePath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
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

  try {
    await writeMetrics(request.body);
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
      const server = app.listen(currentPort, () => {
        console.log(`TV dashboard API listening on http://localhost:${currentPort}`);
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

startServer().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});