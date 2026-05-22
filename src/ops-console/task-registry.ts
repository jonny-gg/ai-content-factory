import fs from 'node:fs';
import path from 'node:path';
import { ensureDir, writeJsonFile } from '../env-config';
import type { ConsoleTaskRecord } from './types';

export interface ConsoleRegistryOptions {
  repoRoot?: string;
}

function resolveRepoRoot(options: ConsoleRegistryOptions = {}): string {
  return path.resolve(options.repoRoot ?? process.cwd());
}

function getRegistryPath(options: ConsoleRegistryOptions = {}): string {
  return path.join(resolveRepoRoot(options), 'output', '.ops-console', 'tasks.json');
}

function loadRegistry(options: ConsoleRegistryOptions = {}): ConsoleTaskRecord[] {
  const filePath = getRegistryPath(options);
  if (!fs.existsSync(filePath)) {
    return [];
  }

  return JSON.parse(fs.readFileSync(filePath, 'utf8')) as ConsoleTaskRecord[];
}

function saveRegistry(tasks: ConsoleTaskRecord[], options: ConsoleRegistryOptions = {}): void {
  const filePath = getRegistryPath(options);
  ensureDir(path.dirname(filePath));
  writeJsonFile(filePath, tasks);
}

export function listConsoleTasks(options: ConsoleRegistryOptions = {}): ConsoleTaskRecord[] {
  return loadRegistry(options).sort((left, right) => right.createdAt.localeCompare(left.createdAt));
}

export function getConsoleTask(taskId: string, options: ConsoleRegistryOptions = {}): ConsoleTaskRecord | undefined {
  return loadRegistry(options).find((task) => task.id === taskId);
}

export function upsertConsoleTask(task: ConsoleTaskRecord, options: ConsoleRegistryOptions = {}): ConsoleTaskRecord {
  const tasks = loadRegistry(options);
  const index = tasks.findIndex((item) => item.id === task.id);
  if (index >= 0) {
    tasks[index] = task;
  } else {
    tasks.push(task);
  }
  saveRegistry(tasks, options);
  return task;
}
