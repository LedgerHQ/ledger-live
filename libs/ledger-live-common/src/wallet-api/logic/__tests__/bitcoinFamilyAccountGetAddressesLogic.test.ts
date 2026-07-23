import { bitcoinFamilyAccountGetAddressesLogic } from "../bitcoin";
import * as converters from "../../converters";
import { getWalletAccount } from "@ledgerhq/coin-bitcoin/getWalletAccount";
import { CRYPTO_CURRENCIES_REGISTRY } from "@domain/entity-currency-crypto";
import { setCryptoAssetsStore } from "@ledgerhq/ledger-wallet-framework/cryptoAssetsStore";
import { createContextContainingAccountId } from "./testHelpers";

jest.mock("../../converters", () => ({
  ...jest.requireActual("../../converters"),
  getAccountIdFromWalletAccountId: jest.fn(),
  accountToWalletAPIAccount: jest.fn(),
}));

jest.mock("@ledgerhq/coin-bitcoin/getWalletAccount", () => ({
  getWalletAccount: jest.fn().mockReturnValue({
    params: { path: "84'/0'", index: 0 },
    xpub: {
      derivationMode: "native_segwit",
      xpub: "xpub",
      crypto: {
        getAddress: jest
          .fn()
          .mockImplementation((_mode, _xpub, account, index) =>
            Promise.resolve(account === 0 && index === 1 ? "0x01" : `addr_${account}_${index}`),
          ),
        getPubkeyAt: jest.fn().mockReturnValue(Buffer.from("testPubkey")),
      },
      getXpubAddresses: jest.fn().mockResolvedValue([
        { account: 0, index: 0, address: "bc1qfirst" },
        { account: 0, index: 1, address: "bc1qsecond" },
        { account: 1, index: 0, address: "bc1qchange0" },
      ]),
      storage: {
        getAddressUnspentUtxos: jest.fn().mockReturnValue([]),
      },
    },
  }),
}));

setCryptoAssetsStore({
  findTokenById: async () => undefined,
  findTokenByAddressInCurrency: async () => undefined,
  getTokensSyncHash: async () => "",
});

const mockedGetAccountIdFromWalletAccountId = jest.mocked(
  converters.getAccountIdFromWalletAccountId,
);
const mockedGetWalletAccount = jest.mocked(getWalletAccount);

describe("bitcoinFamilyAccountGetAddressesLogic", () => {
  const mockBitcoinFamilyAccountAddressesRequested = jest.fn();
  const mockBitcoinFamilyAccountAddressesFail = jest.fn();
  const mockBitcoinFamilyAccountAddressesSuccess = jest.fn();

  const bitcoinCrypto = CRYPTO_CURRENCIES_REGISTRY["bitcoin"];

  const context = createContextContainingAccountId({
    tracking: {
      bitcoinFamilyAccountAddressesRequested: mockBitcoinFamilyAccountAddressesRequested,
      bitcoinFamilyAccountAddressesFail: mockBitcoinFamilyAccountAddressesFail,
      bitcoinFamilyAccountAddressesSuccess: mockBitcoinFamilyAccountAddressesSuccess,
    },
    accountsParams: [{ id: "11" }, { id: "12" }, { id: "13", currency: bitcoinCrypto }],
  });

  const walletAccountId = "806ea21d-f5f0-425a-add3-39d4b78209f1";

  beforeEach(() => {
    mockBitcoinFamilyAccountAddressesRequested.mockClear();
    mockBitcoinFamilyAccountAddressesFail.mockClear();
    mockBitcoinFamilyAccountAddressesSuccess.mockClear();
    mockedGetAccountIdFromWalletAccountId.mockClear();
  });

  it("returns empty array when intentions does not include payment", async () => {
    const accountId = "js:2:bitcoin:0x013:";
    mockedGetAccountIdFromWalletAccountId.mockReturnValueOnce(accountId);

    const result = await bitcoinFamilyAccountGetAddressesLogic(context, walletAccountId, [
      "ordinal",
    ]);

    expect(result).toEqual([]);
    expect(mockBitcoinFamilyAccountAddressesRequested).toHaveBeenCalledTimes(1);
    expect(mockBitcoinFamilyAccountAddressesSuccess).toHaveBeenCalledTimes(1);
    expect(mockBitcoinFamilyAccountAddressesFail).toHaveBeenCalledTimes(0);
  });

  it.each([
    {
      desc: "unknown accountId",
      accountId: undefined,
      errorMessage: `accountId ${walletAccountId} unknown`,
    },
    {
      desc: "account not found",
      accountId: "js:2:ethereum:0x010:",
      errorMessage: "account not found",
    },
    {
      desc: "account is not a bitcoin family account",
      accountId: "js:2:ethereum:0x012:",
      errorMessage: "account requested is not a bitcoin family account",
    },
  ])("rejects when $desc", async ({ accountId, errorMessage }) => {
    mockedGetAccountIdFromWalletAccountId.mockReturnValueOnce(accountId);

    await expect(bitcoinFamilyAccountGetAddressesLogic(context, walletAccountId)).rejects.toThrow(
      errorMessage,
    );

    expect(mockBitcoinFamilyAccountAddressesRequested).toHaveBeenCalledTimes(1);
    expect(mockBitcoinFamilyAccountAddressesFail).toHaveBeenCalledTimes(1);
    expect(mockBitcoinFamilyAccountAddressesSuccess).toHaveBeenCalledTimes(0);
  });

  it("returns addresses with first external address and unused receive and change addresses", async () => {
    const accountId = "js:2:bitcoin:0x013:";
    mockedGetAccountIdFromWalletAccountId.mockReturnValueOnce(accountId);

    const result = await bitcoinFamilyAccountGetAddressesLogic(context, walletAccountId);

    expect(mockBitcoinFamilyAccountAddressesRequested).toHaveBeenCalledTimes(1);
    expect(mockBitcoinFamilyAccountAddressesFail).toHaveBeenCalledTimes(0);
    expect(mockBitcoinFamilyAccountAddressesSuccess).toHaveBeenCalledTimes(1);

    expect(result).toBeInstanceOf(Array);
    expect(result.length).toBeGreaterThan(0);

    const firstExternal = result.find((r: { path?: string }) => r.path === "m/84'/0'/0'/0/0");
    expect(firstExternal).toEqual({
      address: "bc1qfirst",
      publicKey: Buffer.from("testPubkey").toString("hex"),
      path: "m/84'/0'/0'/0/0",
      intention: "payment",
    });

    result.forEach(
      (item: { address: string; publicKey?: string; path?: string; intention?: string }) => {
        expect(item).toHaveProperty("address");
        expect(item).toHaveProperty("publicKey");
        expect(item).toHaveProperty("path");
        expect(item.intention).toBe("payment");
      },
    );
  });

  it("includes at least 2 unused receive and 2 unused change addresses", async () => {
    const accountId = "js:2:bitcoin:0x013:";
    mockedGetAccountIdFromWalletAccountId.mockReturnValueOnce(accountId);

    const result = await bitcoinFamilyAccountGetAddressesLogic(context, walletAccountId);

    const receiveAddresses = result.filter((r: { path?: string }) =>
      /\/0\/\d+$/.test(r.path ?? ""),
    );
    const changeAddresses = result.filter((r: { path?: string }) => /\/1\/\d+$/.test(r.path ?? ""));

    expect(receiveAddresses.length).toBeGreaterThanOrEqual(2);
    expect(changeAddresses.length).toBeGreaterThanOrEqual(2);
  });

  it("includes addresses that have UTXOs", async () => {
    const accountId = "js:2:bitcoin:0x013:";
    mockedGetAccountIdFromWalletAccountId.mockReturnValueOnce(accountId);

    const mockGetAddressUnspentUtxos = jest.fn().mockImplementation((addr: { address: string }) => {
      if (addr.address === "bc1qsecond") return [{ value: "1000" }];
      return [];
    });

    mockedGetWalletAccount.mockReturnValueOnce({
      params: { path: "84'/0'", index: 0 },
      xpub: {
        derivationMode: "native_segwit",
        xpub: "xpub",
        crypto: {
          getAddress: jest
            .fn()
            .mockImplementation((_mode: string, _xpub: string, account: number, index: number) =>
              Promise.resolve(`addr_${account}_${index}`),
            ),
          getPubkeyAt: jest.fn().mockReturnValue(Buffer.from("testPubkey")),
        },
        getXpubAddresses: jest.fn().mockResolvedValue([
          { account: 0, index: 0, address: "bc1qfirst" },
          { account: 0, index: 1, address: "bc1qsecond" },
          { account: 1, index: 0, address: "bc1qchange0" },
        ]),
        storage: {
          getAddressUnspentUtxos: mockGetAddressUnspentUtxos,
        },
      },
    } as unknown as ReturnType<typeof getWalletAccount>);

    const result = await bitcoinFamilyAccountGetAddressesLogic(context, walletAccountId);

    const addrWithUtxo = result.find((r: { path?: string }) => r.path === "m/84'/0'/0'/0/1");
    expect(addrWithUtxo).toBeDefined();
    expect(addrWithUtxo?.address).toBe("bc1qsecond");

    expect(mockGetAddressUnspentUtxos).toHaveBeenCalledTimes(3);

    expect(mockBitcoinFamilyAccountAddressesRequested).toHaveBeenCalledTimes(1);
    expect(mockBitcoinFamilyAccountAddressesFail).toHaveBeenCalledTimes(0);
    expect(mockBitcoinFamilyAccountAddressesSuccess).toHaveBeenCalledTimes(1);
  });
});
