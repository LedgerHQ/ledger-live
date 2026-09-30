import React, { type ReactNode } from "react";
import BigNumber from "bignumber.js";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import type {
  RentPayment,
  SponsoredFeeAsset,
  SponsoredFeeQuote,
} from "@ledgerhq/live-common/bridge/generic-coin-framework/sponsored";
import type { Account, TokenAccount } from "@ledgerhq/types-live";
import {
  TRON_USDT_FEE_ASSET,
  createMockAccount,
  createMockTronUsdtAccount,
} from "../../screens/Recipient/__integrations__/__fixtures__/accounts";
import { getPendingTokenSpent } from "@ledgerhq/live-common/bridge/generic-coin-framework/utils";
import { act, renderHook, withFlagOverrides } from "tests/testSetup";
import { SponsoredSendProvider, useSponsoredSend } from "../SponsoredSendContext";

const USDT_ACCOUNT = createMockTronUsdtAccount({ parentId: "acc_tron" });
const mockAccount = {
  id: "acc_tron",
  type: "Account",
  currency: getCryptoCurrencyById("tron"),
  subAccounts: [USDT_ACCOUNT],
};
let mockTransaction: Record<string, unknown> = { family: "tron", amount: {} };
let mockSendAccount: unknown = mockAccount;
let mockParentAccount: unknown = null;

const mockSponsoredState = {
  phase: "IDLE",
  order: null,
  paymentTxId: null,
  failureKind: null,
  failureError: null,
};
const mockActions = {
  craftRent: jest.fn(),
  startRentPayment: jest.fn(),
  onTransferSuccess: jest.fn(),
  setContractDataFailure: jest.fn(),
  onTransferError: jest.fn(),
  retry: jest.fn(),
  reset: jest.fn(),
};

const mockUseSponsoredSendOrchestration = jest.fn((..._args: unknown[]) => ({
  state: mockSponsoredState,
  actions: mockActions,
}));

jest.mock("@ledgerhq/live-common/flows/send/sponsored/useSponsoredSendOrchestration", () => ({
  useSponsoredSendOrchestration: (...args: unknown[]) => mockUseSponsoredSendOrchestration(...args),
}));

jest.mock("@ledgerhq/live-common/bridge/generic-coin-framework/buildIntent", () => ({
  buildGenericTransactionIntent: jest.fn(() => Promise.resolve({ fake: "intent" })),
}));

const mockSeam = {
  feeOptionId: "sponsored-fixture",
  providerName: "Provider",
  waivesErrorKeys: ["gasLimit"],
  reservationDedupKey: jest.fn(),
};
const mockGetSponsoredCoinApi = jest.fn((..._args: unknown[]) =>
  Promise.resolve(mockSeam as unknown),
);
jest.mock("@ledgerhq/live-common/bridge/generic-coin-framework/sponsored", () => ({
  getSponsoredCoinApi: (...args: unknown[]) => mockGetSponsoredCoinApi(...args),
}));

const flagOn = withFlagOverrides({ gasSponsorship: { enabled: true } });

const USDT_QUOTE: SponsoredFeeQuote = {
  feeAsset: TRON_USDT_FEE_ASSET,
  value: 3_200_000n,
  originalValue: 6_430_000n,
};

const mockUseSponsoredFeeResult = {
  available: false,
  quote: null as SponsoredFeeQuote | null,
  feeAsset: null as SponsoredFeeAsset | null,
  feeTokenAccount: null as TokenAccount | null,
  standardFeeFiat: null as BigNumber | null,
  sponsoredFeeFiat: null as BigNumber | null,
  savingsFiat: null as BigNumber | null,
  feeCurrencyTicker: "USDT",
  loading: false,
};
const mockUseSponsoredFee = jest.fn((..._args: unknown[]) => mockUseSponsoredFeeResult);
jest.mock("../../hooks/useSponsoredFee", () => ({
  useSponsoredFee: (...args: unknown[]) => mockUseSponsoredFee(...args),
}));

const mockUpdateAccountWithUpdater = jest.fn((..._args: unknown[]) => ({
  type: "TEST_UPDATE_ACCOUNT",
}));
jest.mock("~/renderer/actions/accounts", () => ({
  ...jest.requireActual("~/renderer/actions/accounts"),
  updateAccountWithUpdater: (...args: unknown[]) => mockUpdateAccountWithUpdater(...args),
}));

const mockUpdateTransaction = jest.fn();
jest.mock("../SendFlowContext", () => ({
  useSendFlowData: jest.fn(() => ({
    state: {
      account: { account: mockSendAccount, parentAccount: mockParentAccount },
      transaction: { transaction: mockTransaction },
    },
  })),
  useSendFlowActions: jest.fn(() => ({
    transaction: { updateTransaction: mockUpdateTransaction },
  })),
}));

function wrapper({ children }: Readonly<{ children: ReactNode }>) {
  return <SponsoredSendProvider>{children}</SponsoredSendProvider>;
}

describe("SponsoredSendContext", () => {
  beforeEach(() => {
    mockUseSponsoredSendOrchestration.mockClear();
    mockGetSponsoredCoinApi.mockClear();
    mockUseSponsoredFee.mockClear();
    mockUpdateTransaction.mockClear();
    mockActions.reset.mockClear();
    mockUseSponsoredFeeResult.available = false;
    mockUseSponsoredFeeResult.quote = null;
    mockUseSponsoredFeeResult.savingsFiat = null;
    mockUseSponsoredFeeResult.feeAsset = null;
    mockUseSponsoredFeeResult.feeTokenAccount = null;
    mockUseSponsoredFeeResult.standardFeeFiat = null;
    mockUseSponsoredFeeResult.sponsoredFeeFiat = null;
    mockSponsoredState.phase = "IDLE";
    mockTransaction = { family: "tron", amount: {} };
    mockSendAccount = mockAccount;
    mockParentAccount = null;
  });

  it("exposes useSponsoredFee's result (available/quote/savingsFiatFormatted)", () => {
    const { result } = renderHook(() => useSponsoredSend(), { wrapper, initialState: flagOn });

    expect(result.current.available).toBe(false);
    expect(result.current.quote).toBeNull();
    expect(result.current.sponsoredFeeAmounts).toBeNull();
    expect(result.current.savingsFiatFormatted).toBeNull();
    expect(mockUseSponsoredFee).toHaveBeenCalledWith(
      expect.objectContaining({ mainAccount: mockAccount }),
    );
  });

  it("prices the sponsored fee in the fee asset's unit and the standard fee in the account's", () => {
    mockUseSponsoredFeeResult.quote = USDT_QUOTE;
    const { result } = renderHook(() => useSponsoredSend(), { wrapper, initialState: flagOn });

    expect(result.current.sponsoredFeeAmounts).toEqual({
      sponsored: { value: "3.2\u00a0USDT", secondaryValue: null, originalValue: null },
      standard: { value: "6.43\u00a0TRX", secondaryValue: null },
    });
  });

  it("leads each fee with its own fiat value once both rates exist", () => {
    mockUseSponsoredFeeResult.quote = USDT_QUOTE;
    mockUseSponsoredFeeResult.sponsoredFeeFiat = new BigNumber(320);
    mockUseSponsoredFeeResult.standardFeeFiat = new BigNumber(218);
    const { result } = renderHook(() => useSponsoredSend(), { wrapper, initialState: flagOn });

    const amounts = result.current.sponsoredFeeAmounts;
    expect(amounts?.sponsored.secondaryValue).toBe("3.2\u00a0USDT");
    expect(amounts?.standard.secondaryValue).toBe("6.43\u00a0TRX");
    expect(amounts?.sponsored.value).toMatch(/3[.,]20/);
    expect(amounts?.standard.value).toMatch(/2[.,]18/);
  });

  it("passes through the sub-account the sponsored fee is paid from", () => {
    const usdtAccount = createMockTronUsdtAccount({ parentId: "acc_tron" });
    mockUseSponsoredFeeResult.feeTokenAccount = usdtAccount;
    const { result } = renderHook(() => useSponsoredSend(), { wrapper, initialState: flagOn });

    expect(result.current.feeTokenAccount).toBe(usdtAccount);
  });

  it("defaults selectedFeeOptionId to standard and passes the orchestration state through", () => {
    const { result } = renderHook(() => useSponsoredSend(), { wrapper, initialState: flagOn });

    expect(result.current.selectedFeeOptionId).toBe("standard");
    expect(result.current.state).toBe(mockSponsoredState);
  });

  it("exposes the resolved seam's identity and hands the seam to useSponsoredFee", async () => {
    const { result } = renderHook(() => useSponsoredSend(), { wrapper, initialState: flagOn });
    await act(async () => {});

    expect(mockGetSponsoredCoinApi).toHaveBeenCalledWith("tron", "local");
    expect(result.current.sponsoredFeeOptionId).toBe("sponsored-fixture");
    expect(result.current.providerName).toBe("Provider");
    expect(result.current.waivesErrorKeys).toEqual(["gasLimit"]);
    expect(mockUseSponsoredFee).toHaveBeenLastCalledWith(
      expect.objectContaining({ seam: mockSeam }),
    );
  });

  it("drives the orchestration with the TRON network and the local seam kind", () => {
    renderHook(() => useSponsoredSend(), { wrapper, initialState: flagOn });

    expect(mockUseSponsoredSendOrchestration).toHaveBeenCalledWith(
      expect.objectContaining({ network: "tron", kind: "local" }),
    );
  });

  it("selectSponsored/selectStandard toggle selectedFeeOptionId and the sponsored marker while the option is available", async () => {
    mockUseSponsoredFeeResult.available = true;
    const { result } = renderHook(() => useSponsoredSend(), { wrapper, initialState: flagOn });
    await act(async () => {});

    await act(async () => {
      result.current.selectSponsored();
    });
    expect(result.current.selectedFeeOptionId).toBe("sponsored-fixture");
    expect(mockUpdateTransaction).toHaveBeenLastCalledWith(expect.any(Function));
    expect(mockUpdateTransaction.mock.calls.at(-1)![0]({})).toEqual({ sponsored: true });

    await act(async () => {
      result.current.selectStandard();
    });
    expect(result.current.selectedFeeOptionId).toBe("standard");
    expect(mockUpdateTransaction.mock.calls.at(-1)![0]({})).toEqual({ sponsored: false });
  });

  it("reverts to standard and clears the sponsored marker when availability is lost", async () => {
    mockUseSponsoredFeeResult.available = true;
    const { result, rerender } = renderHook(() => useSponsoredSend(), {
      wrapper,
      initialState: flagOn,
    });
    await act(async () => {});

    await act(async () => {
      result.current.selectSponsored();
    });
    expect(result.current.selectedFeeOptionId).toBe("sponsored-fixture");

    mockUseSponsoredFeeResult.available = false;
    await act(async () => {
      rerender();
    });

    expect(result.current.selectedFeeOptionId).toBe("standard");
    expect(mockUpdateTransaction.mock.calls.at(-1)![0]({})).toEqual({ sponsored: false });
  });

  it("keeps the sponsored selection when availability is lost after the flow left IDLE", async () => {
    mockUseSponsoredFeeResult.available = true;
    const { result, rerender } = renderHook(() => useSponsoredSend(), {
      wrapper,
      initialState: flagOn,
    });
    await act(async () => {});

    await act(async () => {
      result.current.selectSponsored();
    });
    mockUpdateTransaction.mockClear();

    mockSponsoredState.phase = "TRANSFER";
    mockUseSponsoredFeeResult.available = false;
    await act(async () => {
      rerender();
    });

    expect(result.current.selectedFeeOptionId).toBe("sponsored-fixture");
    expect(mockUpdateTransaction).not.toHaveBeenCalled();
  });

  it("resets the orchestration when the transaction identity changes", async () => {
    const { rerender } = renderHook(() => useSponsoredSend(), { wrapper, initialState: flagOn });
    mockActions.reset.mockClear();

    mockTransaction = { family: "tron", amount: {}, recipient: "TNewRecipient" };
    await act(async () => {
      rerender();
    });

    expect(mockActions.reset).toHaveBeenCalledTimes(1);
  });

  it("resets the orchestration when useAllAmount toggles (max-send changes the intent though amount stays 0)", async () => {
    mockTransaction = { family: "tron", amount: {}, useAllAmount: false };
    const { rerender } = renderHook(() => useSponsoredSend(), { wrapper, initialState: flagOn });
    mockActions.reset.mockClear();

    mockTransaction = { family: "tron", amount: {}, useAllAmount: true };
    await act(async () => {
      rerender();
    });

    expect(mockActions.reset).toHaveBeenCalledTimes(1);
  });

  it("does not reset a max send when its amount follows the balance", async () => {
    mockTransaction = { family: "tron", amount: new BigNumber(100), useAllAmount: true };
    const { rerender } = renderHook(() => useSponsoredSend(), { wrapper, initialState: flagOn });
    mockActions.reset.mockClear();

    mockTransaction = { family: "tron", amount: new BigNumber(90), useAllAmount: true };
    await act(async () => {
      rerender();
    });

    expect(mockActions.reset).not.toHaveBeenCalled();
  });

  it("does not reset when only the orchestration's actions identity changes", async () => {
    const { rerender } = renderHook(() => useSponsoredSend(), { wrapper, initialState: flagOn });
    const nextActions = { ...mockActions, reset: jest.fn() };
    mockUseSponsoredSendOrchestration.mockReturnValueOnce({
      state: mockSponsoredState,
      actions: nextActions,
    });

    await act(async () => {
      rerender();
    });

    expect(nextActions.reset).not.toHaveBeenCalled();
    expect(mockActions.reset).not.toHaveBeenCalled();
  });

  it("suppresses savingsFiatFormatted when savings is zero (sponsored option not cheaper)", () => {
    mockUseSponsoredFeeResult.savingsFiat = new BigNumber(0);
    const { result } = renderHook(() => useSponsoredSend(), { wrapper, initialState: flagOn });

    expect(result.current.savingsFiatFormatted).toBeNull();

    mockUseSponsoredFeeResult.savingsFiat = null;
  });

  it("passes the orchestration's actions object through unchanged", () => {
    const { result } = renderHook(() => useSponsoredSend(), { wrapper, initialState: flagOn });

    expect(result.current.actions).toBe(mockActions);
  });

  it("degrades to no seam when seam resolution rejects (no unhandled rejection)", async () => {
    mockGetSponsoredCoinApi.mockRejectedValueOnce(new Error("coin-module load failed"));

    const { result } = renderHook(() => useSponsoredSend(), { wrapper, initialState: flagOn });
    await act(async () => {});

    expect(result.current.sponsoredFeeOptionId).toBe("");
    expect(mockUseSponsoredFee).toHaveBeenLastCalledWith(expect.objectContaining({ seam: null }));
    expect(result.current.state).toBe(mockSponsoredState);
    expect(result.current.actions).toBe(mockActions);
  });

  it("selectSponsored is a no-op while no seam has resolved", async () => {
    mockUseSponsoredFeeResult.available = true;
    mockGetSponsoredCoinApi.mockResolvedValueOnce(null);
    const { result } = renderHook(() => useSponsoredSend(), { wrapper, initialState: flagOn });
    await act(async () => {});
    mockUpdateTransaction.mockClear();

    await act(async () => {
      result.current.selectSponsored();
    });

    expect(result.current.selectedFeeOptionId).toBe("standard");
    expect(mockUpdateTransaction).not.toHaveBeenCalled();
  });

  describe("the TX-A rent reservation", () => {
    const RENT_PAYMENT: RentPayment = { asset: TRON_USDT_FEE_ASSET, amount: 3_200_000n };

    type RentPaymentBroadcast = (info: {
      paymentTxId?: string;
      payerAddress: string;
      rentPayment: RentPayment;
    }) => void;

    async function renderAndGetBroadcastHandler(): Promise<RentPaymentBroadcast> {
      renderHook(() => useSponsoredSend(), { wrapper, initialState: flagOn });
      // The handler reserves nothing until the seam has resolved.
      await act(async () => {});
      const params = mockUseSponsoredSendOrchestration.mock.calls.at(-1)?.[0] as {
        onRentPaymentBroadcast: RentPaymentBroadcast;
      };
      return params.onRentPaymentBroadcast;
    }

    beforeEach(() => {
      mockUpdateAccountWithUpdater.mockClear();
      mockSeam.reservationDedupKey.mockReturnValue("123.5");
    });

    it("locks the rent as a pending OUT on the USDT sub-account and leaves the TRX balance alone", async () => {
      const onRentPaymentBroadcast = await renderAndGetBroadcastHandler();

      await act(async () => {
        onRentPaymentBroadcast({
          paymentTxId: "txA",
          payerAddress: "TPayer",
          rentPayment: RENT_PAYMENT,
        });
      });

      expect(mockUpdateAccountWithUpdater).toHaveBeenCalledTimes(1);
      const [accountId, updater] = mockUpdateAccountWithUpdater.mock.calls[0] as [
        string,
        (account: Account) => Account,
      ];
      expect(accountId).toBe("acc_tron");

      const before = createMockAccount({
        id: "acc_tron",
        currency: getCryptoCurrencyById("tron"),
        subAccounts: [USDT_ACCOUNT],
      });
      const after = updater(before);
      const usdtPending = after.subAccounts?.[0]?.pendingOperations ?? [];

      expect(usdtPending).toHaveLength(1);
      expect(usdtPending[0]).toMatchObject({
        type: "OUT",
        hash: "txA",
        accountId: USDT_ACCOUNT.id,
        senders: ["TPayer"],
      });
      expect(getPendingTokenSpent(usdtPending).toString()).toBe("3200000");
      expect(after.pendingOperations).toBe(before.pendingOperations);
    });

    it("reserves nothing when the account holds no sub-account for the rent's asset", async () => {
      const onRentPaymentBroadcast = await renderAndGetBroadcastHandler();

      await act(async () => {
        onRentPaymentBroadcast({
          paymentTxId: "txA",
          payerAddress: "TPayer",
          rentPayment: {
            asset: { type: "trc20", assetReference: "TOtherToken" },
            amount: 3_200_000n,
          },
        });
      });

      expect(mockUpdateAccountWithUpdater).not.toHaveBeenCalled();
    });

    it("reserves a payment once, however often it is reported", async () => {
      const onRentPaymentBroadcast = await renderAndGetBroadcastHandler();
      const info = { paymentTxId: "txA", payerAddress: "TPayer", rentPayment: RENT_PAYMENT };

      await act(async () => {
        onRentPaymentBroadcast(info);
        onRentPaymentBroadcast(info);
      });

      expect(mockUpdateAccountWithUpdater).toHaveBeenCalledTimes(1);
    });
  });

  describe("Max with the sponsored fee", () => {
    const FEE_TOKEN = createMockTronUsdtAccount({
      parentId: "acc_tron",
      balance: new BigNumber(10_000_000),
      spendableBalance: new BigNumber(10_000_000),
    });

    beforeEach(() => {
      mockSendAccount = FEE_TOKEN;
      mockParentAccount = mockAccount;
      mockTransaction = { family: "tron", amount: new BigNumber(0), useAllAmount: true };
      mockUpdateTransaction.mockImplementation(
        (updater: (tx: Record<string, unknown>) => Record<string, unknown>) => {
          mockTransaction = updater(mockTransaction);
        },
      );
      mockUseSponsoredFeeResult.available = true;
      mockUseSponsoredFeeResult.quote = USDT_QUOTE;
      mockUseSponsoredFeeResult.feeTokenAccount = FEE_TOKEN;
    });

    afterEach(() => {
      mockUpdateTransaction.mockReset();
    });

    // The real send flow re-renders on every transaction change; this mock needs an explicit rerender.
    async function renderAndSelectSponsored() {
      const hook = renderHook(() => useSponsoredSend(), { wrapper, initialState: flagOn });
      await act(async () => {});
      await act(async () => {
        hook.result.current.selectSponsored();
      });
      await act(async () => {
        hook.rerender();
      });
      return hook;
    }

    const sentAmount = () => String(mockTransaction.amount);

    it("snaps Max once to what the fee token leaves after the rent and its margin", async () => {
      const { result, rerender } = await renderAndSelectSponsored();

      expect(mockTransaction.useAllAmount).toBe(false);
      expect(sentAmount()).toBe("6768000");
      expect(result.current.sponsoredMaxAmount?.toString()).toBe("6768000");

      mockUseSponsoredFeeResult.quote = { ...USDT_QUOTE, value: 3_000_000n };
      await act(async () => {
        rerender();
      });

      expect(sentAmount()).toBe("6768000");
      expect(mockUpdateTransaction).toHaveBeenCalledTimes(2);
    });

    it("snaps once a quote that arrives after the selection lands", async () => {
      mockUseSponsoredFeeResult.quote = null;
      const { rerender } = await renderAndSelectSponsored();

      expect(mockTransaction.useAllAmount).toBe(true);

      mockUseSponsoredFeeResult.quote = USDT_QUOTE;
      await act(async () => {
        rerender();
      });

      expect(mockTransaction.useAllAmount).toBe(false);
      expect(sentAmount()).toBe("6768000");
    });

    it("restores Max on the standard option while the amount is still the snapped one", async () => {
      const { result } = await renderAndSelectSponsored();
      expect(sentAmount()).toBe("6768000");

      await act(async () => {
        result.current.selectStandard();
      });

      expect(mockTransaction).toMatchObject({ useAllAmount: true, sponsored: false });
      expect(sentAmount()).toBe("0");
    });

    it("keeps an amount the user edited after the snap", async () => {
      const { result } = await renderAndSelectSponsored();
      expect(sentAmount()).toBe("6768000");
      mockTransaction = { ...mockTransaction, amount: new BigNumber(5_000_000) };

      await act(async () => {
        result.current.selectStandard();
      });

      expect(mockTransaction).toMatchObject({ useAllAmount: false, sponsored: false });
      expect(sentAmount()).toBe("5000000");
    });

    it("restores Max when the sponsored option stops being available", async () => {
      const { rerender } = await renderAndSelectSponsored();
      expect(sentAmount()).toBe("6768000");

      mockUseSponsoredFeeResult.available = false;
      await act(async () => {
        rerender();
      });

      expect(mockTransaction).toMatchObject({ useAllAmount: true, sponsored: false });
    });

    it("snaps again when Max is pressed again", async () => {
      const { rerender } = await renderAndSelectSponsored();

      mockTransaction = { ...mockTransaction, useAllAmount: true, amount: new BigNumber(0) };
      await act(async () => {
        rerender();
      });

      expect(sentAmount()).toBe("6768000");
      expect(mockUpdateTransaction).toHaveBeenCalledTimes(3);
    });

    it("leaves Max alone when the send spends another asset", async () => {
      mockSendAccount = mockAccount;
      mockParentAccount = null;

      await renderAndSelectSponsored();

      expect(mockTransaction.useAllAmount).toBe(true);
      expect(mockUpdateTransaction).toHaveBeenCalledTimes(1);
    });

    it("leaves Max alone when nothing is left after the rent and its margin", async () => {
      const tightToken = createMockTronUsdtAccount({
        parentId: "acc_tron",
        balance: new BigNumber(3_232_000),
        spendableBalance: new BigNumber(3_232_000),
      });
      mockSendAccount = tightToken;
      mockUseSponsoredFeeResult.feeTokenAccount = tightToken;

      const { result } = await renderAndSelectSponsored();

      expect(result.current.sponsoredMaxAmount?.toString()).toBe("0");
      expect(mockTransaction.useAllAmount).toBe(true);
    });
  });
});
