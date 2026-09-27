// Jest globalSetup: start the Kaspa Docker stack once before any test file runs.
// Runs in the main Jest process (not a worker), so module state persists to globalTeardown.
import { spawnKaspaNode, killKaspaNode } from "./kaspaNode";
import { deriveAddress, KASPA_TEST_MNEMONIC, KASPA_RECIPIENT_MNEMONIC } from "./signer";
import { toSimnetAddress } from "./addressUtils";
import { fundTestAddress } from "./chainSetup";

export default async function globalSetup(): Promise<void> {
  const testAddress = await deriveAddress(KASPA_TEST_MNEMONIC, 0, 0);
  const recipient = await deriveAddress(KASPA_RECIPIENT_MNEMONIC, 0, 0);

  // Best-effort cleanup on process interruption so Docker doesn't linger after Ctrl+C.
  const cleanup = () => killKaspaNode().catch(() => {});
  process.once("SIGINT", cleanup);
  process.once("SIGTERM", cleanup);

  await spawnKaspaNode(toSimnetAddress(testAddress));
  // Mined once for the whole run: both strategy runs and negativeCases.test.ts share it.
  await fundTestAddress(testAddress, recipient);
}
