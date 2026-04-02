import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

export function wantsHelp(argv: string[] = process.argv): boolean {
  return argv.includes('-h') || argv.includes('--help');
}

export function resolveOptionalJson<T extends Record<string, unknown>>(
  filePath: string,
  fallback: T,
): T {
  const absolutePath = path.resolve(filePath);

  if (!existsSync(absolutePath)) {
    return fallback;
  }

  try {
    const parsed = JSON.parse(readFileSync(absolutePath, 'utf8')) as unknown;
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return { ...fallback, ...(parsed as T) };
    }
  } catch {
    return fallback;
  }

  return fallback;
}

export function resolveOptionalText(filePath: string, fallback = ''): string {
  const absolutePath = path.resolve(filePath);
  if (!existsSync(absolutePath)) {
    return fallback;
  }

  try {
    return readFileSync(absolutePath, 'utf8');
  } catch {
    return fallback;
  }
}
