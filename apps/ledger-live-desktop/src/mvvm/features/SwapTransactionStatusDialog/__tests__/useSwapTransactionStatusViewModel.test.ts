import { renderHook, waitFor } from "@testing-library/react";
import { genAccount, genTokenAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import { getCryptoCurrencyById } from "@ledgerhq/live-common/currencies/index";
import type { TokenCurrency } from "@ledgerhq/types-cryptoassets";
import { getSwapProvider } from "@ledgerhq/live-common/exchange/providers/swap";
import { useSelector } from "LLD/hooks/redux";
import { accountsSelector } from "~/renderer/reducers/accounts";
import { localeSelector } from "~/renderer/reducers/settings";
import { useMaybeAccountName } from "~/renderer/reducers/wallet";
import { useSwapTransactionStatus } from "../hooks/useSwapTransactionStatus";
import { useSwapTransactionStatusViewModel } from "../hooks/useSwapTransactionStatusViewModel";

jest.mock("LLD/hooks/redux");
jest.mock("~/renderer/reducers/wallet", () => ({
  ...jest.requireActual("~/renderer/reducers/wallet"),
  useMaybeAccountName: jest.fn(),
}));
jest.mock("@ledgerhq/live-common/exchange/providers/swap", () => ({
  getSwapProvider: jest.fn(),
}));
jest.mock("~/renderer/families", () => ({
  useLLDCoinFamily: jest.fn(() => ({})),
}));
jest.mock("../hooks/useSwapTransactionStatus", () => ({
  useSwapTransactionStatus: jest.fn(),
}));

const bitcoin = getCryptoCurrencyById("bitcoin");
const ethereum = getCryptoCurrencyById("ethereum");
const usdtEthereum: TokenCurrency = {
  type: "TokenCurrency",
  id: "ethereum/erc20/usd_tether__erc20_",
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
const mockedUseSelector = jest.mocked(useSelector);
const mockedUseMaybeAccountName = jest.mocked(useMaybeAccountName);
const mockedUseSwapTransactionStatus = jest.mocked(useSwapTransactionStatus);
const mockedGetSwapProvider = jest.mocked(getSwapProvider);

function normalizeSpaces(value: string | undefined): string | undefined {
  return value?.replace(/\u00a0/g, " ");
}

describe("useSwapTransactionStatusViewModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseSelector.mockImplementation(selector => {
      if (selector === accountsSelector) return [sendAccount, receiveAccount];
      if (selector === localeSelector) return "en-US";
      return undefined;
    });
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

  it("should map transaction details to the dialog view model", async () => {
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

    const { result } = renderHook(() =>
      useSwapTransactionStatusViewModel({ swapId: "swap-1", provider: "lifi" }),
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

    await waitFor(() => {
      expect(result.current.providerData?.mainUrl).toBe("https://provider.test");
    });
  });

  it("should fall back to pending loading state when details are unavailable", () => {
    mockedUseSwapTransactionStatus.mockReturnValue({
      phase: "polling_hidden",
      latestStatus: undefined,
      details: undefined,
      isInitialLoading: true,
      isSettled: false,
    });

    const { result } = renderHook(() =>
      useSwapTransactionStatusViewModel({ swapId: "swap-1", provider: "lifi" }),
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

    const { result } = renderHook(() =>
      useSwapTransactionStatusViewModel({ swapId: "swap-1", provider: "unknown-provider" }),
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

    const { result } = renderHook(() =>
      useSwapTransactionStatusViewModel({ swapId: "swap-1", provider: "thorswap" }),
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
    mockedUseSelector.mockImplementation(selector => {
      if (selector === accountsSelector) return [sendAccount, receiveParentAccount];
      if (selector === localeSelector) return "en-US";
      return undefined;
    });
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

    const { result } = renderHook(() =>
      useSwapTransactionStatusViewModel({ swapId: "swap-1", provider: "lifi" }),
    );

    expect(mockedUseMaybeAccountName).toHaveBeenCalledWith(receiveParentAccount);
    expect(result.current.receiveAccountName).toBe("Ethereum 2");
    expect(result.current.receiveAccountCurrency).toBe(ethereum);
    expect(result.current.receiveCurrency).toBe(usdtEthereum);
    expect(normalizeSpaces(result.current.receivedAmount)).toBe("2.5 USDT");
  });
});
