/**
 * @jest-environment jsdom
 */
import { act, renderHook, waitFor } from "@testing-library/react";
import { BigNumber } from "bignumber.js";
import type { Account, TokenAccount } from "@ledgerhq/types-live";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import { buildGenericTransactionIntent } from "../../../bridge/generic-coin-framework/buildIntent";
import { getSponsoredCoinApi } from "../../../bridge/generic-coin-framework/sponsored";
import type { Transaction } from "../../../generated/types";
import { USDT_CONTRACT, USDT_RENT_PAYMENT as RENT_PAYMENT } from "./fixtures/usdt";
import { useSponsoredSendOrchestration } from "./useSponsoredSendOrchestration";
import { useSponsoredSendSession } from "./useSponsoredSendSession";

jest.mock("../../../bridge/generic-coin-framework/sponsored", () => ({
  getSponsoredCoinApi: jest.fn(),
}));
jest.mock("../../../bridge/generic-coin-framework/buildIntent", () => ({
  buildGenericTransactionIntent: jest.fn(),
}));
jest.mock("./useSponsoredSendOrchestration", () => ({
  useSponsoredSendOrchestration: jest.fn(),
}));

const mockGetSponsoredCoinApi = jest.mocked(getSponsoredCoinApi);
const mockBuildIntent = jest.mocked(buildGenericTransactionIntent);
const mockOrchestration = jest.mocked(useSponsoredSendOrchestration);

const usdtAccount = {
  type: "TokenAccount",
  id: "usdt-account",
  token: { contractAddress: USDT_CONTRACT },
} as unknown as TokenAccount;

const tronAccount: Account = {
  ...genAccount("tron", { currency: getCryptoCurrencyById("tron") }),
  id: "tron-account",
  subAccounts: [usdtAccount],
};

const makeTransaction = (overrides: Record<string, unknown> = {}) =>
  ({
    family: "tron",
    recipient: "TRecipient",
    amount: new BigNumber(1_000_000),
    useAllAmount: false,
    subAccountId: usdtAccount.id,
    ...overrides,
  }) as unknown as Transaction;

const seam = { reservationDedupKey: jest.fn().mockReturnValue("7.5") };
const reset = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  mockGetSponsoredCoinApi.mockResolvedValue(seam as never);
  mockBuildIntent.mockResolvedValue({ built: true } as never);
  mockOrchestration.mockReturnValue({ state: {}, actions: { reset } } as never);
});

const renderSession = (
  initial: { enabled?: boolean; transaction?: Transaction } = {},
  reservePendingOperation = jest.fn(),
) =>
  renderHook(
    ({ enabled, transaction }) =>
      useSponsoredSendSession({
        enabled,
        account: usdtAccount,
        parentAccount: tronAccount,
        transaction,
        reservePendingOperation,
      }),
    {
      initialProps: {
        enabled: initial.enabled ?? true,
        transaction: initial.transaction ?? makeTransaction(),
      },
    },
  );

const lastBroadcastCallback = () => {
  const params = mockOrchestration.mock.calls.at(-1)?.[0];
  if (!params?.onRentPaymentBroadcast) throw new Error("no broadcast callback");
  return params.onRentPaymentBroadcast;
};

describe("useSponsoredSendSession", () => {
  it("loads nothing while sponsorship is off", () => {
    const { result } = renderSession({ enabled: false });

    expect(result.current.seam).toBeNull();
    expect(result.current.intent).toBeNull();
    expect(mockGetSponsoredCoinApi).not.toHaveBeenCalled();
  });

  it("resolves the main account's seam and builds the intent against the family", async () => {
    const transaction = makeTransaction();
    const { result } = renderSession({ transaction });

    await waitFor(() => expect(result.current.intent).toEqual({ built: true }));
    expect(result.current.mainAccount).toBe(tronAccount);
    expect(result.current.seam).toBe(seam);
    expect(mockGetSponsoredCoinApi).toHaveBeenCalledWith("tron", "local");
    expect(mockBuildIntent).toHaveBeenCalledWith("tron", "local", tronAccount, transaction);
    expect(mockOrchestration).toHaveBeenLastCalledWith(
      expect.objectContaining({ network: "tron", kind: "local", intent: { built: true } }),
    );
  });

  it("flags a failed build and leaves the intent null when the builder rejects", async () => {
    mockBuildIntent.mockRejectedValue(new Error("mid-edit"));
    const { result } = renderSession();

    await waitFor(() => expect(result.current.intentFailed).toBe(true));
    expect(result.current.intent).toBeNull();
  });

  it("keeps the intent when only the sponsored flag changes", async () => {
    const transaction = makeTransaction();
    const { result, rerender } = renderSession({ transaction });
    await waitFor(() => expect(result.current.intent).toEqual({ built: true }));

    rerender({ enabled: true, transaction: { ...transaction, sponsored: true } as Transaction });

    expect(result.current.intent).toEqual({ built: true });
    expect(mockBuildIntent).toHaveBeenCalledTimes(1);
  });

  it("rebuilds the intent when another field changes", async () => {
    const transaction = makeTransaction();
    const { result, rerender } = renderSession({ transaction });
    await waitFor(() => expect(result.current.intent).toEqual({ built: true }));

    rerender({ enabled: true, transaction: makeTransaction({ recipient: "TOther" }) });

    await waitFor(() => expect(mockBuildIntent).toHaveBeenCalledTimes(2));
  });

  it("has no seam when it fails to load", async () => {
    mockGetSponsoredCoinApi.mockRejectedValue(new Error("no module"));
    const { result } = renderSession();

    await waitFor(() => expect(mockGetSponsoredCoinApi).toHaveBeenCalled());
    expect(result.current.seam).toBeNull();
    expect(mockBuildIntent).not.toHaveBeenCalled();
  });

  describe("the TX-A reservation", () => {
    it("files the rent once per payment, as a pending OUT on the fee-token account", async () => {
      const reservePendingOperation = jest.fn();
      const { result } = renderSession({}, reservePendingOperation);
      await waitFor(() => expect(result.current.seam).toBe(seam));

      const broadcast = { paymentTxId: "txA", payerAddress: "TPayer", rentPayment: RENT_PAYMENT };
      act(() => lastBroadcastCallback()(broadcast));
      act(() => lastBroadcastCallback()(broadcast));

      expect(reservePendingOperation).toHaveBeenCalledTimes(1);
      const [mainAccountId, op] = reservePendingOperation.mock.calls[0];
      expect(mainAccountId).toBe(tronAccount.id);
      expect(op).toMatchObject({ type: "OUT", hash: "txA", accountId: usdtAccount.id });
      expect(op.value.toString()).toBe("3200000");
      expect(op.transactionSequenceNumber.toString()).toBe("7.5");
    });

    it.each([
      ["no payment id", { paymentTxId: undefined }],
      [
        "a fee asset the account doesn't hold",
        {
          rentPayment: {
            ...RENT_PAYMENT,
            asset: { ...RENT_PAYMENT.asset, assetReference: "TOther" },
          },
        },
      ],
    ])("files nothing for %s", async (_label, overrides) => {
      const reservePendingOperation = jest.fn();
      const { result } = renderSession({}, reservePendingOperation);
      await waitFor(() => expect(result.current.seam).toBe(seam));

      act(() =>
        lastBroadcastCallback()({
          paymentTxId: "txA",
          payerAddress: "TPayer",
          rentPayment: RENT_PAYMENT,
          ...overrides,
        }),
      );

      expect(reservePendingOperation).not.toHaveBeenCalled();
    });
  });

  describe("the reset on a new send", () => {
    it("resets when the amount changes", async () => {
      const { result, rerender } = renderSession();
      await waitFor(() => expect(result.current.seam).toBe(seam));

      rerender({ enabled: true, transaction: makeTransaction({ amount: new BigNumber(2) }) });
      await waitFor(() => expect(result.current.intent).not.toBeNull());

      expect(reset).toHaveBeenCalledTimes(1);
    });

    it("ignores the sponsored flag and a max send's re-derived amount", async () => {
      const { result, rerender } = renderSession({
        transaction: makeTransaction({ useAllAmount: true }),
      });
      await waitFor(() => expect(result.current.seam).toBe(seam));

      rerender({
        enabled: true,
        transaction: makeTransaction({
          useAllAmount: true,
          amount: new BigNumber(42),
          sponsored: true,
        }),
      });
      await waitFor(() => expect(result.current.intent).not.toBeNull());

      expect(reset).not.toHaveBeenCalled();
    });
  });
});
