import { getZainoEndpoint } from "../constants";
import type { ZCashClient } from "../network/types";

// Lazy module import (renderer-safe): ZCash.ts transitively loads the native
// .node addon. In the Electron renderer, rspack aliases this import to
// ZCashIPC so the IPC client is used instead; on React Native it resolves to
// the stub. Keeping the import dynamic and keyed off the package name (not a
// relative path) preserves that conditional-export aliasing -- see
// package.json's `"./network/ZCash"` export entry.

type ZCashModule = {
  createZCashClient: (args: { grpcUrl: string; network?: string }) => ZCashClient;
};

let zcashClientModuleCache: Promise<ZCashModule> | null = null;

export function getZCashModule(): Promise<ZCashModule> {
  zcashClientModuleCache ??= import(
    /* webpackChunkName: "zcash-native" */ "@ledgerhq/coin-zcash/network/ZCash"
  ) as Promise<ZCashModule>;
  return zcashClientModuleCache;
}

export async function getZCashClient(args: {
  grpcUrl: string;
  network?: string;
}): Promise<ZCashClient> {
  const { createZCashClient } = await getZCashModule();
  return createZCashClient(args);
}

/**
 * Checked once before a send starts, because the three steps happen either side
 * of the device: a client that can build but not finalize would otherwise let
 * the user sign and only then fail (the React Native stub omits all three).
 */
export async function assertCanSend(): Promise<void> {
  const client = await getZCashClient(getZainoEndpoint());
  if (
    !client.buildTransaction ||
    !client.buildIronwoodTransaction ||
    !client.finalizeTransaction ||
    !client.broadcastTransaction
  ) {
    throw new Error("Shielded Zcash transactions are not supported in this environment");
  }
}
