// Jest globalTeardown: tear down the Kaspa Docker stack after all test files finish.
// Runs in the same main process as globalSetup, so kaspaNode's currentMiningAddress is set.
import { killKaspaNode } from "./kaspaNode";

export default async function globalTeardown(): Promise<void> {
  await killKaspaNode();
}
