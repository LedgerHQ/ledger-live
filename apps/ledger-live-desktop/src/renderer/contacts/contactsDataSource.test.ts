import { buildContactsDataSource } from "./contactsDataSource";
import { emptyContactsWallet, type ContactsWallet } from "./types";

const ETH_CHAIN_ID = 1;
const POLYGON_CHAIN_ID = 137;

const walletWithExternal = (): ContactsWallet => ({
  contacts: {
    Alice: {
      name: "Alice",
      groupHandleHex: "0xgroup",
      hmacNameHex: "0xhmacName",
      entries: [
        {
          scope: "personal",
          addressHex: "0xAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAa",
          hmacRestHex: "0xhmacRestA",
          derivationPath: "44'/60'/0'/0/0",
          chainId: ETH_CHAIN_ID,
        },
      ],
    },
  },
  accounts: {},
});

const walletWithLedgerAccount = (): ContactsWallet => ({
  contacts: {},
  accounts: {
    Treasury: {
      name: "Treasury",
      derivationPath: "44'/60'/1'/0/0",
      chainId: ETH_CHAIN_ID,
      addressHex: "0xBbBbBbBbBbBbBbBbBbBbBbBbBbBbBbBbBbBbBbBb",
      hmacProofHex: "0xhmacProofB",
    },
  },
});

describe("buildContactsDataSource", () => {
  it("returns null when the wallet is empty", () => {
    expect(buildContactsDataSource(emptyContactsWallet())).toBeNull();
  });

  it("lookupFrom returns null when no Ledger account matches", async () => {
    const ds = buildContactsDataSource(walletWithExternal())!;
    expect(
      await ds.lookupFrom({ address: "0xunknown", chainId: ETH_CHAIN_ID }),
    ).toBeNull();
  });

  it("lookupFrom returns the Ledger account decoration on a case-insensitive address match", async () => {
    const ds = buildContactsDataSource(walletWithLedgerAccount())!;
    const result = await ds.lookupFrom({
      address: "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
      chainId: ETH_CHAIN_ID,
    });
    expect(result).toEqual({
      accountName: "Treasury",
      hmacProofHex: "0xhmacProofB",
      derivationPath: "44'/60'/1'/0/0",
      chainId: ETH_CHAIN_ID,
    });
  });

  it("lookupFrom returns null when chainId does not match", async () => {
    const ds = buildContactsDataSource(walletWithLedgerAccount())!;
    expect(
      await ds.lookupFrom({
        address: "0xBbBbBbBbBbBbBbBbBbBbBbBbBbBbBbBbBbBbBbBb",
        chainId: POLYGON_CHAIN_ID,
      }),
    ).toBeNull();
  });

  it("lookupTo returns an external decoration when the address matches an external contact", async () => {
    const ds = buildContactsDataSource(walletWithExternal())!;
    const result = await ds.lookupTo({
      address: "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
      chainId: ETH_CHAIN_ID,
    });
    expect(result).toEqual({
      kind: "external",
      contactName: "Alice",
      scope: "personal",
      addressHex: "0xAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAa",
      groupHandleHex: "0xgroup",
      hmacNameHex: "0xhmacName",
      hmacRestHex: "0xhmacRestA",
      derivationPath: "44'/60'/0'/0/0",
      chainId: ETH_CHAIN_ID,
    });
  });

  it("lookupTo returns a ledgerAccount decoration when the address matches a Ledger account", async () => {
    const ds = buildContactsDataSource(walletWithLedgerAccount())!;
    const result = await ds.lookupTo({
      address: "0xBbBbBbBbBbBbBbBbBbBbBbBbBbBbBbBbBbBbBbBb",
      chainId: ETH_CHAIN_ID,
    });
    expect(result).toEqual({
      kind: "ledgerAccount",
      accountName: "Treasury",
      hmacProofHex: "0xhmacProofB",
      derivationPath: "44'/60'/1'/0/0",
      chainId: ETH_CHAIN_ID,
    });
  });

  it("lookupTo prefers a Ledger-account match over an external match for the same address", async () => {
    const wallet: ContactsWallet = {
      contacts: walletWithExternal().contacts,
      accounts: {
        Self: {
          name: "Self",
          derivationPath: "44'/60'/2'/0/0",
          chainId: ETH_CHAIN_ID,
          addressHex: "0xAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAa",
          hmacProofHex: "0xhmacProofSelf",
        },
      },
    };
    const ds = buildContactsDataSource(wallet)!;
    const result = await ds.lookupTo({
      address: "0xAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAa",
      chainId: ETH_CHAIN_ID,
    });
    expect(result).toMatchObject({ kind: "ledgerAccount", accountName: "Self" });
  });

  it("lookupTo returns null when chainId does not match", async () => {
    const ds = buildContactsDataSource(walletWithExternal())!;
    expect(
      await ds.lookupTo({
        address: "0xAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAa",
        chainId: POLYGON_CHAIN_ID,
      }),
    ).toBeNull();
  });
});
