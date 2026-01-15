import type { ConcordiumWalletConnectContext } from "../types";

let walletConnect: ConcordiumWalletConnectContext | null = null;

export function setWalletConnect(context: ConcordiumWalletConnectContext | null): void {
  walletConnect = context;
}

export function getWalletConnect(): ConcordiumWalletConnectContext | null {
  return walletConnect;
}
