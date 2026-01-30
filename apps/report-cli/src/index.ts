#!/usr/bin/env node
/**
 * Report CLI Entry Point
 *
 * 这是一个 Skeleton 版本，用于验证架构可行性
 */

import { Orchestrator } from '@report-cli/lifecycle';

async function main() {
  const orchestrator = new Orchestrator();
  await orchestrator.run();
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
