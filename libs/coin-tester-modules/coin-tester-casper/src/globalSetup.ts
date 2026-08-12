// Registered before importing casperDevnet.ts, which transitively resolves the
// "casper" currency at module load — globalSetup runs before setupFilesAfterEnv.
import "@ledgerhq/wallet-framework-test-setup";
import { spawnDevnet } from "./casperDevnet";

export default async function globalSetup(): Promise<void> {
  await spawnDevnet();
}
