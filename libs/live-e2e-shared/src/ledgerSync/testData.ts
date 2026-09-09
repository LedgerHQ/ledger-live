/** The name the CLI registers its trustchain member under, so the name the apps display for it. */
export const CLI_MEMBER_NAME = "CLI";

/** An account as it is stored in the trustchain, matching `accountDescriptorSchema`. */
export interface LedgerSyncAccountDescriptor {
  id: string;
  currencyId: string;
  index: number;
  seedIdentifier: string;
  derivationMode: string;
  freshAddress: string;
}

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

export const secondEthAccount: LedgerSyncAccountDescriptor = {
  id: "mock:1:ethereum:0x1aB2c3D4e5F60718293A4b5C6d7E8f90A1b2C3d4:",
  currencyId: "ethereum",
  index: 1,
  seedIdentifier: "mock",
  derivationMode: "",
  freshAddress: "0x1aB2c3D4e5F60718293A4b5C6d7E8f90A1b2C3d4",
};
