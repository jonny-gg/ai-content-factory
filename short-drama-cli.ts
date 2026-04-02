#!/usr/bin/env ts-node
import { Command } from 'commander';
import { wantsHelp } from './src/cli-utils';
import { runShortDramaGenerationCli } from './src/short-drama-factory';

async function main(): Promise<void> {
  const program = new Command();

  program
    .name('short-drama')
    .description('Generate short-drama content from the local pipeline')
    .option('-c, --config <path>', 'Path to runtime config JSON')
    .option('-t, --template <path>', 'Path to prompt template file')
    .option('--topic <text>', 'Override the topic for this run')
    .option('--style <text>', 'Override the short-drama style/angle')
    .option('--dry-run', 'Validate config and print resolved inputs without generating')
    .showHelpAfterError();

  program.action(async (options) => {
    await runShortDramaGenerationCli(options);
  });

  if (wantsHelp(process.argv)) {
    program.outputHelp();
    return;
  }

  await program.parseAsync(process.argv);
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`short-drama CLI failed: ${message}`);
  process.exit(1);
});
