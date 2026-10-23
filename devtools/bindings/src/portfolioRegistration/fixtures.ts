import type { AccountDescriptor } from "@domain/entity-account-descriptor";

export const address = (name: string, addr: string, path: string): AccountDescriptor => ({
  purpose: "account",
  version: "1",
  type: "address",
  network: { name, env: "main" },
  address: addr,
  path,
});

export const utxo = (xpub: string, name = "bitcoin"): AccountDescriptor => ({
  purpose: "account",
  version: "1",
  type: "utxo",
  network: { name, env: "main" },
  xpub,
  path: "m/84h/0h/0h",
});

export const XPUB = "x".repeat(111);
export const EVM_ADDRESS = `0x${"ab".repeat(20)}`;
export const EVM_PATH = "m/44h/60h/0h/0/0";
