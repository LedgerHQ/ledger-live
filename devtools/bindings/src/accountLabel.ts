import type { AccountDescriptor } from "@domain/entity-account-descriptor";

/** The network and what identifies the account on it, shortened for an xpub. */
export const accountLabel = (descriptor: AccountDescriptor) =>
  `${descriptor.network} ${
    descriptor.type === "utxo" ? `${descriptor.xpub.slice(0, 12)}…` : descriptor.address
  }`;
