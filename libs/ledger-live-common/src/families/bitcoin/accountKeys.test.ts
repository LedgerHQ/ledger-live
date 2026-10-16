import type { Account } from "@ledgerhq/types-live";
import { AccountNeedResync } from "@ledgerhq/wallet-btc/errors";
import { getBitcoinAccountKeys } from "./accountKeys";
import {
  UTXO_ACCOUNT_STATE_VERSION,
  type UtxoAccountState,
  type UtxoAddressState,
} from "@ledgerhq/account-module-utxo";
import { cryptoFor } from "./accountModule/derivation";

jest.mock("./accountModule/derivation", () => ({
  ...jest.requireActual("./accountModule/derivation"),
  cryptoFor: jest.fn(),
}));

const mockedCryptoFor = jest.mocked(cryptoFor);

const crypto = {
  getAddress: jest.fn(),
  getPubkeyAt: jest.fn(),
};

const accountState = (addresses: UtxoAddressState[], unspentOn: string[] = []) => ({
  version: UTXO_ACCOUNT_STATE_VERSION,
  data: {
    syncedHeight: 100,
    anchor: null,
    addresses,
    confirmedUtxos: [],
    utxos: unspentOn.map(address => ({
      txid: "txid",
      vout: 0,
      value: "1000",
      address,
      height: 1,
      replaceable: false,
    })),
    refreshedAt: 0,
  } satisfies UtxoAccountState,
});

const createAccount = (overrides: Record<string, unknown> = {}): Account =>
  ({
    id: "js:2:bitcoin:xpubTEST:native_segwit",
    currency: { id: "bitcoin" },
    derivationMode: "native_segwit",
    index: 3,
    freshAddressPath: "84'/0'/3'/0/12",
    ...overrides,
  }) as unknown as Account;

describe("getBitcoinAccountKeys", () => {
  beforeEach(() => {
    crypto.getAddress.mockReset().mockResolvedValue("bc1qderived");
    crypto.getPubkeyAt.mockReset().mockResolvedValue(Buffer.from("pubkey"));
    mockedCryptoFor.mockReset().mockReturnValue(crypto as never);
  });

  describe("an account of the legacy bridge (wallet-btc store)", () => {
    const getUniquesAddresses = jest.fn();
    const getAddressUnspentUtxos = jest.fn();
    const walletCrypto = { getAddress: jest.fn(), getPubkeyAt: jest.fn() };
    const zcashAccount = createAccount({
      id: "js:2:zcash:xpubZEC:",
      currency: { id: "zcash" },
      bitcoinResources: {
        utxos: [],
        walletAccount: {
          params: { path: "44'/133'", index: 1 },
          xpub: {
            xpub: "xpubZEC",
            derivationMode: "Legacy",
            crypto: walletCrypto,
            storage: { getUniquesAddresses, getAddressUnspentUtxos },
          },
        },
      },
    });

    it("reads the root path and the account index from the store params", () => {
      const keys = getBitcoinAccountKeys(zcashAccount);

      expect(keys.rootPath).toBe("44'/133'");
      expect(keys.accountIndex).toBe(1);
      expect(mockedCryptoFor).not.toHaveBeenCalled();
    });

    it("derives addresses and public keys with the store's xpub", async () => {
      walletCrypto.getAddress.mockResolvedValue("t1address");
      walletCrypto.getPubkeyAt.mockResolvedValue(Buffer.from("zecpub"));
      const keys = getBitcoinAccountKeys(zcashAccount);

      await expect(keys.addressAt(0, 4)).resolves.toBe("t1address");
      expect(walletCrypto.getAddress).toHaveBeenCalledWith("Legacy", "xpubZEC", 0, 4);
      await expect(keys.pubkeyAt(1, 2)).resolves.toEqual(Buffer.from("zecpub"));
      expect(walletCrypto.getPubkeyAt).toHaveBeenCalledWith("xpubZEC", 1, 2);
    });

    it("lists the stored addresses and whether they hold unspent outputs", () => {
      getUniquesAddresses.mockReturnValue([
        { address: "t1used", account: 0, index: 0 },
        { address: "t1empty", account: 1, index: 3 },
        { address: "t1unknown", account: 0, index: 5 },
      ]);
      getAddressUnspentUtxos.mockImplementation(({ address }: { address: string }) => {
        if (address === "t1used") return [{ value: "1" }];
        if (address === "t1empty") return [];
        return undefined;
      });

      expect(getBitcoinAccountKeys(zcashAccount).addresses()).toEqual([
        { address: "t1used", chain: 0, index: 0, hasUtxo: true },
        { address: "t1empty", chain: 1, index: 3, hasUtxo: false },
        { address: "t1unknown", chain: 0, index: 5, hasUtxo: false },
      ]);
      expect(getUniquesAddresses).toHaveBeenCalledWith({});
    });
  });

  describe("an account of the generic bridge (account layer state)", () => {
    it("derives the root path from the fresh address path and keeps the account index", () => {
      const keys = getBitcoinAccountKeys(
        createAccount({ bitcoinResources: { utxos: [], accountState: accountState([]) } }),
      );

      expect(keys.rootPath).toBe("84'/0'");
      expect(keys.accountIndex).toBe(3);
      expect(mockedCryptoFor).toHaveBeenCalledWith("bitcoin");
    });

    it("derives addresses and public keys from the account id's xpub", async () => {
      const keys = getBitcoinAccountKeys(
        createAccount({ bitcoinResources: { utxos: [], accountState: accountState([]) } }),
      );

      await expect(keys.addressAt(1, 7)).resolves.toBe("bc1qderived");
      expect(crypto.getAddress).toHaveBeenCalledWith("Native SegWit", "xpubTEST", 1, 7);
      await expect(keys.pubkeyAt(0, 2)).resolves.toEqual(Buffer.from("pubkey"));
      expect(crypto.getPubkeyAt).toHaveBeenCalledWith("xpubTEST", 0, 2);
    });

    it("maps the derivation mode of the account to wallet-btc's", async () => {
      const keys = getBitcoinAccountKeys(
        createAccount({
          id: "js:2:bitcoin:xpubTEST:",
          derivationMode: "",
          bitcoinResources: { utxos: [], accountState: accountState([]) },
        }),
      );

      await keys.addressAt(0, 0);
      expect(crypto.getAddress).toHaveBeenCalledWith("Legacy", "xpubTEST", 0, 0);
    });

    it("lists the state's addresses, flagging those holding a spendable output", () => {
      const keys = getBitcoinAccountKeys(
        createAccount({
          bitcoinResources: {
            utxos: [],
            accountState: accountState(
              [
                { address: "bc1qused", chain: 0, index: 0 },
                { address: "bc1qempty", chain: 1, index: 2 },
              ],
              ["bc1qused"],
            ),
          },
        }),
      );

      expect(keys.addresses()).toEqual([
        { address: "bc1qused", chain: 0, index: 0, hasUtxo: true },
        { address: "bc1qempty", chain: 1, index: 2, hasUtxo: false },
      ]);
    });

    it("matches Bitcoin Cash outputs on the address form the state keeps", () => {
      const keys = getBitcoinAccountKeys(
        createAccount({
          id: "js:2:bitcoin_cash:xpubBCH:",
          currency: { id: "bitcoin_cash" },
          derivationMode: "",
          freshAddressPath: "145'/145'/0'/0/0",
          bitcoinResources: {
            utxos: [],
            accountState: accountState(
              [{ address: "bitcoincash:qpcashaddr", chain: 0, index: 0 }],
              ["bitcoincash:qpcashaddr"],
            ),
          },
        }),
      );

      expect(keys.rootPath).toBe("145'/145'");
      expect(keys.addresses()).toEqual([
        { address: "bitcoincash:qpcashaddr", chain: 0, index: 0, hasUtxo: true },
      ]);
    });

    it("treats missing spendable outputs as none", () => {
      const keys = getBitcoinAccountKeys(
        createAccount({
          bitcoinResources: {
            accountState: accountState([{ address: "bc1qaddr", chain: 0, index: 0 }]),
          },
        }),
      );

      expect(keys.addresses()).toEqual([
        { address: "bc1qaddr", chain: 0, index: 0, hasUtxo: false },
      ]);
    });
  });

  describe("an account that must be synced again", () => {
    it.each([
      ["has no bitcoin resources", {}],
      ["has no account state", { bitcoinResources: { utxos: [] } }],
      [
        "has a state of another version",
        {
          bitcoinResources: {
            utxos: [],
            accountState: { ...accountState([]), version: UTXO_ACCOUNT_STATE_VERSION + 1 },
          },
        },
      ],
      [
        "is a libcore account",
        {
          id: "libcore:1:bitcoin:xpubTEST:native_segwit",
          bitcoinResources: { utxos: [], accountState: accountState([]) },
        },
      ],
    ])("throws AccountNeedResync when it %s", (_, overrides) => {
      expect(() => getBitcoinAccountKeys(createAccount(overrides))).toThrow(AccountNeedResync);
      expect(mockedCryptoFor).not.toHaveBeenCalled();
    });
  });
});
