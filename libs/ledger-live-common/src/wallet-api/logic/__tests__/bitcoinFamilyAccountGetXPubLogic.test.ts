import { bitcoinFamilyAccountGetXPubLogic } from "../bitcoin";
import * as converters from "../../converters";
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

describe("bitcoinFamilyAccountGetXPubLogic", () => {
  const mockBitcoinFamilyAccountXpubRequested = jest.fn();
  const mockBitcoinFamilyAccountXpubFail = jest.fn();
  const mockBitcoinFamilyAccountXpubSuccess = jest.fn();

  const bitcoinCrypto = cryptocurrenciesById["bitcoin"];

  const context = createContextContainingAccountId({
    tracking: {
      bitcoinFamilyAccountXpubRequested: mockBitcoinFamilyAccountXpubRequested,
      bitcoinFamilyAccountXpubFail: mockBitcoinFamilyAccountXpubFail,
      bitcoinFamilyAccountXpubSuccess: mockBitcoinFamilyAccountXpubSuccess,
    },
    accountsParams: [{ id: "11" }, { id: "12" }, { id: "13", currency: bitcoinCrypto }],
  });

  beforeEach(() => {
    mockBitcoinFamilyAccountXpubRequested.mockClear();
    mockBitcoinFamilyAccountXpubFail.mockClear();
    mockBitcoinFamilyAccountXpubSuccess.mockClear();
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
      await bitcoinFamilyAccountGetXPubLogic(context, walletAccountId);
    }).rejects.toThrow(errorMessage);

    expect(mockBitcoinFamilyAccountXpubRequested).toHaveBeenCalledTimes(1);
    expect(mockBitcoinFamilyAccountXpubFail).toHaveBeenCalledTimes(1);
    expect(mockBitcoinFamilyAccountXpubSuccess).toHaveBeenCalledTimes(0);
  });

  it("should return the xpub", async () => {
    const accountId = "js:2:bitcoin:0x013:";
    mockedGetAccountIdFromWalletAccountId.mockReturnValueOnce(accountId);

    const result = await bitcoinFamilyAccountGetXPubLogic(context, walletAccountId);

    expect(result).toEqual("testxpub");
    expect(mockBitcoinFamilyAccountXpubRequested).toHaveBeenCalledTimes(1);
    expect(mockBitcoinFamilyAccountXpubFail).toHaveBeenCalledTimes(0);
    expect(mockBitcoinFamilyAccountXpubSuccess).toHaveBeenCalledTimes(1);
  });
});
