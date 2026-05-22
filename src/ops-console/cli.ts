#!/usr/bin/env node
import { startOpsConsoleServer } from './server';

const port = Number(process.env.OPS_CONSOLE_PORT || 3210);
startOpsConsoleServer(port);
console.log(`Ops console running at http://localhost:${port}`);
