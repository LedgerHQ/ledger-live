import type { LedgerSyncAccountDescriptor } from "tests/utils/ledgerSyncCliUtils";

/**
 * Accounts seeded straight into a Ledger Sync trustchain, so the app pulls them on boot.
 * A `mock:` id routes to the offline mock bridge whatever the MOCK env, and carrying no
 * `accountNames` entry is what keeps an account on its default name ("Ethereum 1").
 */
export const ethAccount: LedgerSyncAccountDescriptor = {
  id: "mock:1:ethereum:0x6Cbcd73CD8e8a42844662f0A0e76D7F79Afd933d:",
  currencyId: "ethereum",
  index: 0,
  seedIdentifier: "mock",
  derivationMode: "",
  freshAddress: "0x6Cbcd73CD8e8a42844662f0A0e76D7F79Afd933d",
};
