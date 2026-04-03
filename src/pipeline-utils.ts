export function logStage(stage: string, message: string, extra?: Record<string, unknown>): void {
  const prefix = `[${stage}]`;
  if (extra) {
    console.log(prefix, message, extra);
    return;
  }

  console.log(prefix, message);
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function withRetry<T>(
  stage: string,
  fn: () => Promise<T>,
  options?: { retries?: number; baseDelayMs?: number; onRetry?: (attempt: number, error: unknown) => void }
): Promise<T> {
  const retries = options?.retries ?? 3;
  const baseDelayMs = options?.baseDelayMs ?? 1500;

  let attempt = 0;
  let lastError: unknown;
  while (attempt < retries) {
    attempt += 1;
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt >= retries) break;
      options?.onRetry?.(attempt, error);
      logStage(stage, `retrying after failure`, { attempt, error: String(error) });
      await sleep(baseDelayMs * attempt);
    }
  }

  throw lastError;
}

export async function withTimeout<T>(promise: Promise<T>, timeoutMs: number, label: string): Promise<T> {
  let timer: NodeJS.Timeout | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timer = setTimeout(() => reject(new Error(`${label} timed out after ${timeoutMs}ms`)), timeoutMs);
      })
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

export interface CostRecord {
  stage: string;
  model?: string;
  inputTokens?: number;
  outputTokens?: number;
  estimatedCostUsd?: number;
  notes?: string;
}

export function estimateOpenAICostUsd(inputTokens = 0, outputTokens = 0): number {
  const inputRate = 0.0000004;
  const outputRate = 0.0000016;
  return Number((inputTokens * inputRate + outputTokens * outputRate).toFixed(6));
}
