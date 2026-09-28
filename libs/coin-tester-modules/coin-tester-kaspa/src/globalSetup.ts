// Jest globalSetup: start the Kaspa Docker stack once before any test file runs.
// Runs in the main Jest process (not a worker), so module state persists to globalTeardown.
import { spawnKaspaNode, killKaspaNode } from "./kaspaNode";
import { deriveAddress, KASPA_RECIPIENT_MNEMONIC } from "./signer";
import { toSimnetAddress } from "./addressUtils";
import { fundTestAccounts } from "./chainSetup";

export default async function globalSetup(): Promise<void> {
  const recipient = await deriveAddress(KASPA_RECIPIENT_MNEMONIC, 0, 0);

  // Best-effort cleanup on process interruption so Docker doesn't linger after Ctrl+C.
  const cleanup = () => killKaspaNode().catch(() => {});
  process.once("SIGINT", cleanup);
  process.once("SIGTERM", cleanup);

  // The miner's default pay address is the (never synced) recipient: blocks mined without an
  // explicit payAddress — every beforeSync confirmation block — never add to a test account.
  await spawnKaspaNode(toSimnetAddress(recipient));
  // Mined once for the whole run: every scenario run and negativeCases.test.ts use this state.
  await fundTestAccounts(recipient);
}
