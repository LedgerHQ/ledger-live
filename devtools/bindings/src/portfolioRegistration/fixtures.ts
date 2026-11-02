import type { AccountDescriptor } from "@domain/entity-account-descriptor";

export const address = (network: string, addr: string, path: string): AccountDescriptor => ({
  purpose: "account",
  version: "2",
  type: "address",
  network,
  address: addr,
  path,
});

export const utxo = (xpub: string, network = "bitcoin"): AccountDescriptor => ({
  purpose: "account",
  version: "2",
  type: "utxo",
  network,
  xpub,
  path: "m/84h/0h/0h",
});

export const XPUB = "x".repeat(111);
export const EVM_ADDRESS = `0x${"ab".repeat(20)}`;
export const EVM_PATH = "m/44h/60h/0h/0/0";
