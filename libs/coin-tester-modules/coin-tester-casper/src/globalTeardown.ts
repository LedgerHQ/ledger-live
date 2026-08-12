// See globalSetup.ts: casperDevnet.ts needs the currencies resolver bootstrapped before import.
import "@ledgerhq/wallet-framework-test-setup";
import { killDevnet } from "./casperDevnet";

export default async function globalTeardown(): Promise<void> {
  await killDevnet();
}
