import { AccountKeySchema, type AccountDescriptor } from "@domain/entity-account-descriptor";
import { DerivationPathSchema } from "@domain/entity-derivation";
import { NetworkIdSchema } from "@domain/entity-network";

export const address = (network: string, addr: string, path: string): AccountDescriptor => ({
  purpose: "account",
  version: "2",
  type: "address",
  network: NetworkIdSchema.parse(network),
  key: AccountKeySchema.parse(addr),
  path: DerivationPathSchema.parse(path),
});

export const utxo = (xpub: string, network = "bitcoin"): AccountDescriptor => ({
  purpose: "account",
  version: "2",
  type: "utxo",
  network: NetworkIdSchema.parse(network),
  key: AccountKeySchema.parse(xpub),
  path: DerivationPathSchema.parse("m/84h/0h/0h"),
});

export const XPUB = "x".repeat(111);
export const EVM_ADDRESS = `0x${"ab".repeat(20)}`;
export const EVM_PATH = "m/44h/60h/0h/0/0";
