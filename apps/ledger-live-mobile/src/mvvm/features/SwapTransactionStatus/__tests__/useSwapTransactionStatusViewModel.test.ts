import { renderHook, waitFor, withFlagOverrides } from "@tests/test-renderer";
import { genAccount, genTokenAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import { getCryptoCurrencyById } from "@ledgerhq/live-common/currencies/index";
import type { TransactionStatusValue } from "@ledgerhq/live-common/wallet-api/Exchange/transactionStatus/index";
import type { Account } from "@ledgerhq/types-live";
import { TokenCurrencySchema, type TokenCurrency } from "@domain/entity-currency";
import { getSwapProvider } from "@ledgerhq/live-common/exchange/providers/swap";
import { useMaybeAccountName } from "~/reducers/wallet";
import type { State } from "~/reducers/types";
import { useSwapTransactionStatus } from "../hooks/useSwapTransactionStatus";
import { useSwapTransactionStatusViewModel } from "../hooks/useSwapTransactionStatusViewModel";

jest.mock("~/reducers/wallet", () => ({
  ...jest.requireActual("~/reducers/wallet"),
  useMaybeAccountName: jest.fn(),
}));
jest.mock("@ledgerhq/live-common/exchange/providers/swap", () => ({
  getSwapProvider: jest.fn(),
}));
jest.mock("~/generated/operationDetails", () => ({}));
jest.mock("../hooks/useSwapTransactionStatus", () => ({
  useSwapTransactionStatus: jest.fn(),
}));

const bitcoin = getCryptoCurrencyById("bitcoin");
const ethereum = getCryptoCurrencyById("ethereum");
const usdtEthereum: TokenCurrency = {
  type: "TokenCurrency",
  id: TokenCurrencySchema.shape.id.parse("ethereum/erc20/usd_tether__erc20_"),
  parentCurrencyId: ethereum.id,
  tokenType: "erc20",
  contractAddress: "0xdac17f958d2ee523a2206206994597c13d831ec7",
  ticker: "USDT",
  name: "Tether USD",
  units: [
    {
      name: "Tether USD",
      code: "USDT",
      magnitude: 6,
    },
  ],
};
const sendAccount = genAccount("bitcoin-account", { currency: bitcoin });
const receiveAccount = genAccount("ethereum-account", { currency: ethereum });
const mockedUseMaybeAccountName = jest.mocked(useMaybeAccountName);
const mockedUseSwapTransactionStatus = jest.mocked(useSwapTransactionStatus);
const mockedGetSwapProvider = jest.mocked(getSwapProvider);

function normalizeSpaces(value: string | undefined): string | undefined {
  return value?.replace(/ /g, " ");
}

const withTestAccounts =
  (accounts: Account[]) =>
  (state: State): State => ({
    ...state,
    accounts: { ...state.accounts, active: accounts },
    settings: { ...state.settings, locale: "en-US" },
  });

function mockSwapStatus(provider: string, receiveStatus: TransactionStatusValue) {
  mockedUseSwapTransactionStatus.mockReturnValue({
    phase: "settled_visible",
    latestStatus: {
      provider,
      swapId: "swap-1",
      status: receiveStatus,
    },
    details: {
      provider,
      swapId: "swap-1",
      status: receiveStatus,
      sendStatus: "finished",
      receiveStatus,
      fromAccountId: sendAccount.id,
      toAccountId: receiveAccount.id,
      receivedAmount: "2000000000000000000",
    },
    isInitialLoading: false,
    isSettled: true,
  });
}

describe("useSwapTransactionStatusViewModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseMaybeAccountName.mockReturnValue("Ethereum 1");
    mockedGetSwapProvider.mockResolvedValue({
      type: "CEX",
      name: "provider",
      publicKey: {
        curve: "secp256k1",
        data: Buffer.from("test-public-key"),
      },
      signature: Buffer.from("test-signature"),
      needsKYC: false,
      termsOfUseUrl: "https://provider.test/terms",
      supportUrl: "https://provider.test/support",
      mainUrl: "https://provider.test",
      useInExchangeApp: true,
      displayName: "Provider",
    });
  });

  it("should map transaction details to the drawer view model", async () => {
    mockedUseSwapTransactionStatus.mockReturnValue({
      phase: "settled_visible",
      latestStatus: {
        provider: "lifi",
        swapId: "swap-1",
        status: "finished",
        finalAmount: "2000000000000000000",
      },
      details: {
        provider: "lifi",
        swapId: "swap-1",
        status: "finished",
        sendStatus: "finished",
        receiveStatus: "finished",
        fromAccountId: sendAccount.id,
        toAccountId: receiveAccount.id,
        sentAmount: "123456789",
        receivedAmount: "2000000000000000000",
        finalAmount: "2100000000000000000",
        feesAmount: "10000",
        operationHash: "hash-1",
        createdAt: 1_704_210_240_000,
      },
      isInitialLoading: false,
      isSettled: true,
    });

    const { result } = renderHook(
      () =>
        useSwapTransactionStatusViewModel({
          params: { swapId: "swap-1", provider: "lifi" },
          onClose: jest.fn(),
        }),
      { overrideInitialState: withTestAccounts([sendAccount, receiveAccount]) },
    );

    expect(result.current.sendCurrency).toBe(bitcoin);
    expect(result.current.receiveCurrency).toBe(ethereum);
    expect(result.current.receiveAccountCurrency).toBe(ethereum);
    expect(normalizeSpaces(result.current.sentAmount)).toBe("1.23456789 BTC");
    expect(normalizeSpaces(result.current.receivedAmount)).toBe("2.1 ETH");
    expect(normalizeSpaces(result.current.feesAmount)).toBe("0.0001 BTC");
    expect(result.current.receiveAccountName).toBe("Ethereum 1");
    expect(result.current.sendStatus).toBe("finished");
    expect(result.current.receiveStatus).toBe("finished");
    expect(result.current.explorerUrl).toBe("https://scan.li.fi/tx/hash-1");
    expect(result.current.isStatusSectionLoading).toBe(false);
    expect(result.current.isFooterLoading).toBe(false);
    expect(result.current.showReceivedAmountEstimated).toBe(false);

    await waitFor(() => {
      expect(result.current.providerData?.mainUrl).toBe("https://provider.test");
    });
  });

  it("should mark a finished received amount as estimated when enabled for the provider", () => {
    mockSwapStatus("moonpay", "finished");

    const { result } = renderHook(
      () =>
        useSwapTransactionStatusViewModel({
          params: { swapId: "swap-1", provider: "moonpay" },
          onClose: jest.fn(),
        }),
      {
        overrideInitialState: withFlagOverrides(
          {
            ptxSwapEstimatedReceivedAmount: {
              enabled: true,
              params: { providers: { moonpay: true } },
            },
          },
          withTestAccounts([sendAccount, receiveAccount]),
        ),
      },
    );

    expect(result.current.showReceivedAmountEstimated).toBe(true);
  });

  it("should not mark a pending received amount as estimated", () => {
    mockSwapStatus("moonpay", "pending");

    const { result } = renderHook(
      () =>
        useSwapTransactionStatusViewModel({
          params: { swapId: "swap-1", provider: "moonpay" },
          onClose: jest.fn(),
        }),
      {
        overrideInitialState: withFlagOverrides(
          {
            ptxSwapEstimatedReceivedAmount: {
              enabled: true,
              params: { providers: { moonpay: true } },
            },
          },
          withTestAccounts([sendAccount, receiveAccount]),
        ),
      },
    );

    expect(result.current.showReceivedAmountEstimated).toBe(false);
  });

  it("should not mark a received amount as estimated when the feature is disabled", () => {
    mockSwapStatus("moonpay", "finished");

    const { result } = renderHook(
      () =>
        useSwapTransactionStatusViewModel({
          params: { swapId: "swap-1", provider: "moonpay" },
          onClose: jest.fn(),
        }),
      {
        overrideInitialState: withFlagOverrides(
          {
            ptxSwapEstimatedReceivedAmount: {
              enabled: false,
              params: { providers: { moonpay: true } },
            },
          },
          withTestAccounts([sendAccount, receiveAccount]),
        ),
      },
    );

    expect(result.current.showReceivedAmountEstimated).toBe(false);
  });

  it("should fall back to pending loading state when details are unavailable", () => {
    mockedUseSwapTransactionStatus.mockReturnValue({
      phase: "polling_hidden",
      latestStatus: undefined,
      details: undefined,
      isInitialLoading: true,
      isSettled: false,
    });

    const { result } = renderHook(
      () =>
        useSwapTransactionStatusViewModel({
          params: { swapId: "swap-1", provider: "lifi" },
          onClose: jest.fn(),
        }),
      { overrideInitialState: withTestAccounts([sendAccount, receiveAccount]) },
    );

    expect(result.current.provider).toBe("lifi");
    expect(result.current.sendStatus).toBe("pending");
    expect(result.current.receiveStatus).toBe("pending");
    expect(result.current.isStatusSectionLoading).toBe(true);
    expect(result.current.isFooterLoading).toBe(true);
    expect(result.current.explorerUrl).toBeUndefined();
  });

  it("should clear provider metadata when provider lookup fails", async () => {
    mockedGetSwapProvider.mockRejectedValue(new Error("provider unavailable"));
    mockedUseSwapTransactionStatus.mockReturnValue({
      phase: "settled_visible",
      latestStatus: {
        provider: "unknown-provider",
        swapId: "swap-1",
        status: "finished",
      },
      details: {
        provider: "unknown-provider",
        swapId: "swap-1",
        status: "finished",
        fromAccountId: sendAccount.id,
        toAccountId: receiveAccount.id,
      },
      isInitialLoading: false,
      isSettled: true,
    });

    const { result } = renderHook(
      () =>
        useSwapTransactionStatusViewModel({
          params: { swapId: "swap-1", provider: "unknown-provider" },
          onClose: jest.fn(),
        }),
      { overrideInitialState: withTestAccounts([sendAccount, receiveAccount]) },
    );

    await waitFor(() => {
      expect(mockedGetSwapProvider).toHaveBeenCalledWith("unknown-provider");
    });
    expect(result.current.providerData).toBeUndefined();
  });

  it("should display a completed receive status when the local send transaction is finished", () => {
    mockedUseSwapTransactionStatus.mockReturnValue({
      phase: "settled_visible",
      latestStatus: {
        provider: "thorswap",
        swapId: "swap-1",
        status: "unknown",
      },
      details: {
        provider: "thorswap",
        swapId: "swap-1",
        status: "unknown",
        sendStatus: "finished",
        receiveStatus: "unknown",
        fromAccountId: sendAccount.id,
        toAccountId: receiveAccount.id,
      },
      isInitialLoading: false,
      isSettled: true,
    });

    const { result } = renderHook(
      () =>
        useSwapTransactionStatusViewModel({
          params: { swapId: "swap-1", provider: "thorswap" },
          onClose: jest.fn(),
        }),
      { overrideInitialState: withTestAccounts([sendAccount, receiveAccount]) },
    );

    expect(result.current.sendStatus).toBe("finished");
    expect(result.current.receiveStatus).toBe("finished");
  });

  it("should use the parent account name and icon currency for token receive accounts", () => {
    const receiveParentAccount = genAccount("ethereum-token-parent-account", {
      currency: ethereum,
    });
    const receiveTokenAccount = genTokenAccount(0, receiveParentAccount, usdtEthereum);
    receiveParentAccount.subAccounts = [receiveTokenAccount];
    mockedUseMaybeAccountName.mockReturnValue("Ethereum 2");
    mockedUseSwapTransactionStatus.mockReturnValue({
      phase: "settled_visible",
      latestStatus: {
        provider: "lifi",
        swapId: "swap-1",
        status: "finished",
      },
      details: {
        provider: "lifi",
        swapId: "swap-1",
        status: "finished",
        fromAccountId: sendAccount.id,
        toAccountId: receiveTokenAccount.id,
        receivedAmount: "2500000",
      },
      isInitialLoading: false,
      isSettled: true,
    });

    const { result } = renderHook(
      () =>
        useSwapTransactionStatusViewModel({
          params: { swapId: "swap-1", provider: "lifi" },
          onClose: jest.fn(),
        }),
      { overrideInitialState: withTestAccounts([sendAccount, receiveParentAccount]) },
    );

    expect(mockedUseMaybeAccountName).toHaveBeenCalledWith(receiveParentAccount);
    expect(result.current.receiveAccountName).toBe("Ethereum 2");
    expect(result.current.receiveAccountCurrency).toBe(ethereum);
    expect(result.current.receiveCurrency).toBe(usdtEthereum);
    expect(normalizeSpaces(result.current.receivedAmount)).toBe("2.5 USDT");
  });
});
