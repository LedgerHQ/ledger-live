import type { ConcordiumWalletConnectContext } from "../types";

let walletConnectContext: ConcordiumWalletConnectContext | null = null;

export function setWalletConnectContext(context: ConcordiumWalletConnectContext | null): void {
  walletConnectContext = context;
}

export function getWalletConnectContext(): ConcordiumWalletConnectContext | null {
  return walletConnectContext;
}
