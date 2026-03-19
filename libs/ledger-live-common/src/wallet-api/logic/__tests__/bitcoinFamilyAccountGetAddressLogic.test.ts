import { bitcoinFamilyAccountGetAddressLogic } from "../bitcoin";
import * as converters from "../../converters";
import { getWalletAccount } from "@ledgerhq/coin-bitcoin/wallet-btc/index";
import { cryptocurrenciesById } from "@ledgerhq/cryptoassets/currencies";
import { setupMockCryptoAssetsStore } from "@ledgerhq/cryptoassets/cal-client/test-helpers";
import { createContextContainingAccountId } from "./testHelpers";

jest.mock("../../converters", () => ({
  ...jest.requireActual("../../converters"),
  getAccountIdFromWalletAccountId: jest.fn(),
  accountToWalletAPIAccount: jest.fn(),
}));

jest.mock("@ledgerhq/coin-bitcoin/lib/wallet-btc/index", () => ({
  ...jest.requireActual("@ledgerhq/coin-bitcoin/lib/wallet-btc/index"),
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

setupMockCryptoAssetsStore();

const mockedGetAccountIdFromWalletAccountId = jest.mocked(
  converters.getAccountIdFromWalletAccountId,
);

describe("bitcoinFamilyAccountGetAddressLogic", () => {
  const mockBitcoinFamilyAccountAddressRequested = jest.fn();
  const mockBitcoinFamilyAccountAddressFail = jest.fn();
  const mockBitcoinFamilyAccountAddressSuccess = jest.fn();

  const bitcoinCrypto = cryptocurrenciesById["bitcoin"];

  const context = createContextContainingAccountId({
    tracking: {
      bitcoinFamilyAccountAddressRequested: mockBitcoinFamilyAccountAddressRequested,
      bitcoinFamilyAccountAddressFail: mockBitcoinFamilyAccountAddressFail,
      bitcoinFamilyAccountAddressSuccess: mockBitcoinFamilyAccountAddressSuccess,
    },
    accountsParams: [{ id: "11" }, { id: "12" }, { id: "13", currency: bitcoinCrypto }],
  });

  beforeEach(() => {
    mockBitcoinFamilyAccountAddressRequested.mockClear();
    mockBitcoinFamilyAccountAddressFail.mockClear();
    mockBitcoinFamilyAccountAddressSuccess.mockClear();
    mockedGetAccountIdFromWalletAccountId.mockClear();
  });

  const walletAccountId = "806ea21d-f5f0-425a-add3-39d4b78209f1";

  it.each([
    {
      desc: "receive unkown accountId",
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
      errorMessage: "not a bitcoin family account",
    },
  ])("returns an error when $desc", async ({ accountId, errorMessage }) => {
    mockedGetAccountIdFromWalletAccountId.mockReturnValueOnce(accountId);

    await expect(async () => {
      await bitcoinFamilyAccountGetAddressLogic(context, walletAccountId);
    }).rejects.toThrow(errorMessage);

    expect(mockBitcoinFamilyAccountAddressRequested).toHaveBeenCalledTimes(1);
    expect(mockBitcoinFamilyAccountAddressFail).toHaveBeenCalledTimes(1);
    expect(mockBitcoinFamilyAccountAddressSuccess).toHaveBeenCalledTimes(0);
  });

  it("should return the address", async () => {
    const accountId = "js:2:bitcoin:0x013:";
    mockedGetAccountIdFromWalletAccountId.mockReturnValueOnce(accountId);

    const result = await bitcoinFamilyAccountGetAddressLogic(context, walletAccountId);

    expect(result).toEqual("0x01");
    expect(mockBitcoinFamilyAccountAddressRequested).toHaveBeenCalledTimes(1);
    expect(mockBitcoinFamilyAccountAddressFail).toHaveBeenCalledTimes(0);
    expect(mockBitcoinFamilyAccountAddressSuccess).toHaveBeenCalledTimes(1);
  });

  it("should return the address with a derivationPath", async () => {
    const accountId = "js:2:bitcoin:0x013:";
    mockedGetAccountIdFromWalletAccountId.mockReturnValueOnce(accountId);

    const result = await bitcoinFamilyAccountGetAddressLogic(context, walletAccountId, "0/1");

    expect(result).toEqual("0x01");
    expect(mockBitcoinFamilyAccountAddressRequested).toHaveBeenCalledTimes(1);
    expect(mockBitcoinFamilyAccountAddressFail).toHaveBeenCalledTimes(0);
    expect(mockBitcoinFamilyAccountAddressSuccess).toHaveBeenCalledTimes(1);
  });
});
