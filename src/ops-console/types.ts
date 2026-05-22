export type ConsoleRunKind = 'story' | 'execution-pack' | 'daily' | 'weekly-package' | 'weekly-matrix';
export type ConsoleRunStatus = 'success' | 'failed' | 'unknown';
export type ConsoleTaskStatus = 'queued' | 'running' | 'succeeded' | 'failed';
export type ArtifactKind = 'json' | 'markdown' | 'text' | 'audio' | 'image' | 'directory' | 'other';

export interface ArtifactRef {
  name: string;
  path: string;
  relativePath: string;
  kind: ArtifactKind;
}

export interface ConsoleRunSummary {
  id: string;
  kind: ConsoleRunKind;
  title: string;
  subtitle?: string;
  createdAt: string;
  status: ConsoleRunStatus;
  runDir: string;
  relativeRunDir: string;
  topic?: string;
  platform?: string;
  count?: number;
}

export interface ConsoleRunDetail extends ConsoleRunSummary {
  artifacts: ArtifactRef[];
  payload: Record<string, unknown>;
  viewer?: {
    textFiles?: Array<{ label: string; path: string; content: string }>;
    relatedRuns?: Array<{ id: string; title: string; path: string }>;
  };
}

export interface RuntimeReadiness {
  llmConfigured: boolean;
  hfConfigured: boolean;
  ffmpegAvailable: boolean;
}

export interface DashboardData {
  runtime: RuntimeReadiness;
  recentRuns: ConsoleRunSummary[];
  latestByKind: Partial<Record<ConsoleRunKind, ConsoleRunSummary>>;
  failedRuns: ConsoleRunSummary[];
  countsByKind: Partial<Record<ConsoleRunKind, number>>;
  tasks: ConsoleTaskRecord[];
}

export interface ConsoleTaskRecord {
  id: string;
  workflow: 'story' | 'execution-pack' | 'daily';
  label: string;
  status: ConsoleTaskStatus;
  createdAt: string;
  startedAt?: string;
  finishedAt?: string;
  command: string;
  args: string[];
  params: Record<string, unknown>;
  latestRunId?: string;
  stdoutPreview?: string;
  stderrPreview?: string;
  error?: string;
  exitCode?: number;
}
