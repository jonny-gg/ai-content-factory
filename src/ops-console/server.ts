import fs from 'node:fs';
import path from 'node:path';
import { createServer } from 'node:http';
import { getDashboardData, getConsoleRunDetail, listConsoleRuns } from './artifact-store';
import { getConsoleStaticDir, triggerDailyWorkflow, triggerExecutionPackWorkflow, triggerStoryWorkflow } from './workflows';
import { listConsoleTasks } from './task-registry';

function sendJson(response: import('node:http').ServerResponse, status: number, body: unknown): void {
  response.statusCode = status;
  response.setHeader('Content-Type', 'application/json; charset=utf-8');
  response.end(JSON.stringify(body, null, 2));
}

function sendText(response: import('node:http').ServerResponse, status: number, body: string, contentType = 'text/plain; charset=utf-8'): void {
  response.statusCode = status;
  response.setHeader('Content-Type', contentType);
  response.end(body);
}

function readBody(request: import('node:http').IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let body = '';
    request.on('data', (chunk) => {
      body += String(chunk);
    });
    request.on('end', () => resolve(body));
    request.on('error', reject);
  });
}

function serveStatic(response: import('node:http').ServerResponse, requestPath: string): void {
  const staticDir = getConsoleStaticDir();
  const resolvedPath = requestPath === '/' ? path.join(staticDir, 'index.html') : path.join(staticDir, requestPath.replace(/^\//, ''));
  if (!resolvedPath.startsWith(staticDir) || !fs.existsSync(resolvedPath)) {
    sendText(response, 404, 'Not found');
    return;
  }

  const ext = path.extname(resolvedPath).toLowerCase();
  const contentType = ext === '.html'
    ? 'text/html; charset=utf-8'
    : ext === '.css'
      ? 'text/css; charset=utf-8'
      : 'application/javascript; charset=utf-8';
  sendText(response, 200, fs.readFileSync(resolvedPath, 'utf8'), contentType);
}

async function handleApi(request: import('node:http').IncomingMessage, response: import('node:http').ServerResponse): Promise<boolean> {
  const url = new URL(request.url ?? '/', 'http://localhost');
  if (!url.pathname.startsWith('/api/')) {
    return false;
  }

  if (request.method === 'GET' && url.pathname === '/api/dashboard') {
    sendJson(response, 200, getDashboardData());
    return true;
  }

  if (request.method === 'GET' && url.pathname === '/api/runs') {
    sendJson(response, 200, { items: listConsoleRuns() });
    return true;
  }

  if (request.method === 'GET' && url.pathname.startsWith('/api/runs/')) {
    const runId = decodeURIComponent(url.pathname.replace('/api/runs/', ''));
    const detail = getConsoleRunDetail(runId);
    if (!detail) {
      sendJson(response, 404, { error: 'Run not found' });
      return true;
    }
    sendJson(response, 200, detail);
    return true;
  }

  if (request.method === 'GET' && url.pathname === '/api/tasks') {
    sendJson(response, 200, { items: listConsoleTasks() });
    return true;
  }

  if (request.method === 'POST' && url.pathname === '/api/workflows/story') {
    const body = JSON.parse(await readBody(request) || '{}') as { topic?: string; platform?: 'douyin' | 'xiaohongshu' | 'tiktok'; style?: string; dryRun?: boolean };
    if (!body.topic?.trim()) {
      sendJson(response, 400, { error: 'Missing topic' });
      return true;
    }
    sendJson(response, 202, triggerStoryWorkflow({
      topic: body.topic,
      platform: body.platform,
      style: body.style,
      dryRun: body.dryRun
    }));
    return true;
  }

  if (request.method === 'POST' && url.pathname === '/api/workflows/execution-pack') {
    const body = JSON.parse(await readBody(request) || '{}') as { count?: number; platform?: 'douyin' | 'xiaohongshu' | 'tiktok'; diverseOnly?: boolean };
    sendJson(response, 202, triggerExecutionPackWorkflow({
      count: Number(body.count || 3),
      platform: body.platform,
      diverseOnly: body.diverseOnly ?? true
    }));
    return true;
  }

  if (request.method === 'POST' && url.pathname === '/api/workflows/daily') {
    const body = JSON.parse(await readBody(request) || '{}') as { dryRun?: boolean };
    sendJson(response, 202, triggerDailyWorkflow({ dryRun: body.dryRun ?? true }));
    return true;
  }

  sendJson(response, 404, { error: 'Unknown API endpoint' });
  return true;
}

export function startOpsConsoleServer(port = 3210): import('node:http').Server {
  const server = createServer(async (request, response) => {
    try {
      const handled = await handleApi(request, response);
      if (handled) return;
      serveStatic(response, new URL(request.url ?? '/', 'http://localhost').pathname);
    } catch (error) {
      sendJson(response, 500, { error: error instanceof Error ? error.message : String(error) });
    }
  });

  server.listen(port);
  return server;
}

if (typeof require !== 'undefined' && typeof module !== 'undefined' && require.main === module) {
  const port = Number(process.env.OPS_CONSOLE_PORT || 3210);
  startOpsConsoleServer(port);
  console.log(`Ops console running at http://localhost:${port}`);
}
