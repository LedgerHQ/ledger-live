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

  describe("address prefix-insensitivity", () => {
    // ContextModule passes tx.to as ethers parses it (EIP-55, 0x-prefixed).
    // The L1 dialog's add-contact fixture stores addressHex without 0x.
    // Lookup must succeed regardless of which side has the prefix.

    const walletUnprefixed = (): ContactsWallet => ({
      contacts: {
        Alice: {
          name: "Alice",
          groupHandleHex: "0xgroup",
          hmacNameHex: "0xhmacName",
          entries: [
            {
              scope: "personal",
              addressHex: "abcdef0123456789abcdef0123456789abcdef01",
              hmacRestHex: "0xhmacRestA",
              derivationPath: "44'/60'/0'/0/0",
              chainId: ETH_CHAIN_ID,
            },
          ],
        },
      },
      accounts: {
        Treasury: {
          name: "Treasury",
          derivationPath: "44'/60'/1'/0/0",
          chainId: ETH_CHAIN_ID,
          addressHex: "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
          hmacProofHex: "0xhmacProofB",
        },
      },
    });

    it("matches stored unprefixed external address against a 0x-prefixed EIP-55 lookup", async () => {
      const ds = buildContactsDataSource(walletUnprefixed())!;
      const result = await ds.lookupTo({
        address: "0xAbCdEf0123456789AbCdEf0123456789AbCdEf01",
        chainId: ETH_CHAIN_ID,
      });
      expect(result).toMatchObject({ kind: "external", contactName: "Alice" });
    });

    it("matches stored unprefixed Ledger account against a 0x-prefixed lookup", async () => {
      const ds = buildContactsDataSource(walletUnprefixed())!;
      const result = await ds.lookupFrom({
        address: "0xBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB",
        chainId: ETH_CHAIN_ID,
      });
      expect(result).toMatchObject({ accountName: "Treasury" });
    });

    it("matches stored 0x-prefixed external address against an unprefixed lookup", async () => {
      const ds = buildContactsDataSource(walletWithExternal())!;
      const result = await ds.lookupTo({
        address: "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
        chainId: ETH_CHAIN_ID,
      });
      expect(result).toMatchObject({ kind: "external", contactName: "Alice" });
    });

    it("preserves the stored addressHex verbatim in the returned decoration (HMAC depends on byte-for-byte identity)", async () => {
      const ds = buildContactsDataSource(walletUnprefixed())!;
      const result = await ds.lookupTo({
        address: "0xAbCdEf0123456789AbCdEf0123456789AbCdEf01",
        chainId: ETH_CHAIN_ID,
      });
      expect(result).toMatchObject({
        addressHex: "abcdef0123456789abcdef0123456789abcdef01",
      });
    });
  });

  describe("registered Ledger accounts (L2.2 — From & self-transfer)", () => {
    // DMK's SignTransactionDeviceAction resolves the sender address from the
    // BIP32 path via GetAddressCommand and stitches it into subset.from before
    // calling ContextModule.getContexts. The data source must return a
    // ledgerAccount decoration when from === a registered LWD account, and
    // prefer that same match for to in a self-transfer.

    const walletWithSelfAccount = (): ContactsWallet => ({
      contacts: {},
      accounts: {
        "Account 1": {
          name: "Account 1",
          derivationPath: "44'/60'/0'/0/0",
          chainId: ETH_CHAIN_ID,
          addressHex: "0xCcCcCcCcCcCcCcCcCcCcCcCcCcCcCcCcCcCcCcCc",
          hmacProofHex: "0xhmacProofSelf",
        },
      },
    });

    it("lookupFrom matches a registered Ledger account on a Send (From decoration)", async () => {
      const ds = buildContactsDataSource(walletWithSelfAccount())!;
      const result = await ds.lookupFrom({
        address: "0xcccccccccccccccccccccccccccccccccccccccc",
        chainId: ETH_CHAIN_ID,
      });
      expect(result).toEqual({
        accountName: "Account 1",
        hmacProofHex: "0xhmacProofSelf",
        derivationPath: "44'/60'/0'/0/0",
        chainId: ETH_CHAIN_ID,
      });
    });

    it("lookupTo returns ledgerAccount decoration in a self-transfer (to === from)", async () => {
      const ds = buildContactsDataSource(walletWithSelfAccount())!;
      const result = await ds.lookupTo({
        address: "0xcccccccccccccccccccccccccccccccccccccccc",
        chainId: ETH_CHAIN_ID,
      });
      expect(result).toMatchObject({
        kind: "ledgerAccount",
        accountName: "Account 1",
      });
    });
  });
});
