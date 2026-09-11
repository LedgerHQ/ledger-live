import { DerivationModes } from "@ledgerhq/wallet-btc/types";
import { deriveAccountMeta, buildSyncedAccount } from "../buildAccount";
import { getCryptoCurrencyById } from "@ledgerhq/ledger-wallet-framework/currencies";
import { walletBtcCurrencyById } from "../../walletBtcCurrency";

// The wallet mocks are created INSIDE the factory (jest hoists jest.mock above the imports, so a
// factory referencing outer consts would hit a TDZ). We retrieve them afterwards via requireMock.
// A fresh BitcoinLikeWallet per call — never wallet-btc's getWallet() singleton — is the stateless
// construction the module relies on.
jest.mock("@ledgerhq/wallet-btc/wallet", () => {
  const generateAccount = jest.fn();
  const syncAccount = jest.fn();
  return {
    __esModule: true,
    default: jest.fn(() => ({ generateAccount, syncAccount })),
    __mocks: { generateAccount, syncAccount },
  };
});
jest.mock("@ledgerhq/ledger-wallet-framework/currencies", () => ({
  getCryptoCurrencyById: jest.fn(() => ({ isTestnetFor: null })),
}));
jest.mock("../../walletBtcCurrency", () => ({
  walletBtcCurrencyById: jest.fn(() => ({ id: "bitcoin-wallet-btc-currency" })),
}));

const walletModule = jest.requireMock("@ledgerhq/wallet-btc/wallet") as {
  default: jest.Mock;
  __mocks: { generateAccount: jest.Mock; syncAccount: jest.Mock };
};
const mockWalletCtor = walletModule.default;
const mockGenerateAccount = walletModule.__mocks.generateAccount;
const mockSyncAccount = walletModule.__mocks.syncAccount;

const mockedGetCrypto = getCryptoCurrencyById as jest.MockedFunction<typeof getCryptoCurrencyById>;
const mockedWalletBtcCurrency = walletBtcCurrencyById as jest.MockedFunction<
  typeof walletBtcCurrencyById
>;

describe("logic/deriveAccountMeta", () => {
  it.each([
    ["44'/0'/0'", DerivationModes.LEGACY, "legacy", "44'/0'", 0, "44'/0'/0'"],
    ["49'/0'/1'", DerivationModes.SEGWIT, "p2sh", "49'/0'", 1, "49'/0'/1'"],
    ["84'/0'/2'", DerivationModes.NATIVE_SEGWIT, "bech32", "84'/0'", 2, "84'/0'/2'"],
    ["86'/0'/0'", DerivationModes.TAPROOT, "bech32m", "86'/0'", 0, "86'/0'/0'"],
  ])(
    "parses %s into script type + account paths",
    (path, mode, format, rootPath, index, accountPath) => {
      const meta = deriveAccountMeta(path as string);
      expect(meta.derivationMode).toBe(mode);
      expect(meta.addressFormat).toBe(format);
      expect(meta.rootPath).toBe(rootPath);
      expect(meta.accountIndex).toBe(index);
      expect(meta.accountPath).toBe(accountPath);
    },
  );

  it("throws when the derivation path is missing", () => {
    expect(() => deriveAccountMeta(undefined)).toThrow(/requires a derivation path/);
  });

  it("throws when the path has fewer than three levels", () => {
    expect(() => deriveAccountMeta("84'/0'")).toThrow(/purpose'\/coin'\/account'/);
  });

  it("throws on an unsupported derivation purpose", () => {
    expect(() => deriveAccountMeta("100'/0'/0'")).toThrow(/unsupported derivation purpose/);
  });
});

describe("logic/buildSyncedAccount", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedGetCrypto.mockReturnValue({ isTestnetFor: null } as unknown as ReturnType<
      typeof getCryptoCurrencyById
    >);
    mockedWalletBtcCurrency.mockReturnValue({
      id: "bitcoin-wallet-btc-currency",
    } as unknown as ReturnType<typeof walletBtcCurrencyById>);
  });

  it("generates the account from the xpub + derivation path, then syncs it to the tip", async () => {
    const account = { xpub: { explorer: { getCurrentBlock: async () => ({ height: 123 }) } } };
    mockGenerateAccount.mockResolvedValue(account);

    const result = await buildSyncedAccount("bitcoin", "zpub123", "84'/0'/0'");

    expect(mockWalletCtor).toHaveBeenCalledTimes(1); // fresh wallet, no singleton
    expect(mockGenerateAccount).toHaveBeenCalledWith(
      {
        xpub: "zpub123",
        path: "84'/0'",
        index: 0,
        currency: "bitcoin",
        network: "mainnet",
        derivationMode: DerivationModes.NATIVE_SEGWIT,
      },
      { id: "bitcoin-wallet-btc-currency" },
    );
    expect(mockSyncAccount).toHaveBeenCalledWith(account, 123);
    expect(result).toBe(account);
  });

  it("targets the testnet network when the currency is a testnet", async () => {
    mockedGetCrypto.mockReturnValue({ isTestnetFor: "bitcoin" } as unknown as ReturnType<
      typeof getCryptoCurrencyById
    >);
    mockGenerateAccount.mockResolvedValue({
      xpub: { explorer: { getCurrentBlock: async () => ({ height: 5 }) } },
    });

    await buildSyncedAccount("bitcoin_testnet", "tpub", "84'/1'/0'");

    expect(mockGenerateAccount.mock.calls[0][0]).toMatchObject({ network: "testnet" });
  });

  it("syncs from height 0 when the explorer has no current block", async () => {
    const account = { xpub: { explorer: { getCurrentBlock: async () => null } } };
    mockGenerateAccount.mockResolvedValue(account);

    await buildSyncedAccount("bitcoin", "zpub123", "84'/0'/0'");

    expect(mockSyncAccount).toHaveBeenCalledWith(account, 0);
  });
});
