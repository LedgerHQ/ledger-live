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
import {
  PENDING_RENT_EXPIRY_MARGIN_MS,
  clearPendingRent,
  getPendingRent,
  recordPendingRent,
  resetPendingRentsForTests,
} from "./pendingRents";
import { SPONSORED_PHASE } from "./types";
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

const seam = {
  reservationDedupKey: jest.fn().mockReturnValue("7.5"),
  isEnergyDelivered: jest.fn(),
  awaitEnergyDelivery: jest.fn(),
};
const reset = jest.fn();

const BROADCAST = {
  paymentTxId: "txA",
  payerAddress: "TPayer",
  rentPayment: RENT_PAYMENT,
  orderId: "order-1",
  receiverAddress: "TReceiver",
  energyNeeded: 64_285n,
  paymentExpiresAt: Date.now() + 360_000,
};

const FOREIGN_FEE_ASSET = {
  rentPayment: { ...RENT_PAYMENT, asset: { ...RENT_PAYMENT.asset, assetReference: "TOther" } },
};

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>(res => {
    resolve = res;
  });
  return { promise, resolve };
}

const setOrchestrationState = (state: Record<string, unknown>) =>
  mockOrchestration.mockReturnValue({ state, actions: { reset } } as never);

beforeEach(() => {
  jest.clearAllMocks();
  resetPendingRentsForTests();
  seam.isEnergyDelivered.mockResolvedValue(false);
  seam.awaitEnergyDelivery.mockReturnValue(new Promise<void>(() => {}));
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
      expect.objectContaining({
        network: "tron",
        kind: "local",
        intent: { built: true },
        mainAccountId: tronAccount.id,
      }),
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

      act(() => lastBroadcastCallback()(BROADCAST));
      act(() => lastBroadcastCallback()(BROADCAST));

      expect(reservePendingOperation).toHaveBeenCalledTimes(1);
      const [mainAccountId, op] = reservePendingOperation.mock.calls[0];
      expect(mainAccountId).toBe(tronAccount.id);
      expect(op).toMatchObject({ type: "OUT", hash: "txA", accountId: usdtAccount.id });
      expect(op.value.toString()).toBe("3200000");
      expect(op.transactionSequenceNumber.toString()).toBe("7.5");
    });

    it.each([
      ["no payment id", { paymentTxId: undefined }],
      ["a fee asset the account doesn't hold", FOREIGN_FEE_ASSET],
    ])("files nothing for %s", async (_label, overrides) => {
      const reservePendingOperation = jest.fn();
      const { result } = renderSession({}, reservePendingOperation);
      await waitFor(() => expect(result.current.seam).toBe(seam));

      act(() => lastBroadcastCallback()({ ...BROADCAST, ...overrides }));

      expect(reservePendingOperation).not.toHaveBeenCalled();
    });
  });

  describe("the pending rent", () => {
    it("remembers the paid rent for a reopened Send", async () => {
      const { result } = renderSession();
      await waitFor(() => expect(result.current.seam).toBe(seam));

      act(() => lastBroadcastCallback()(BROADCAST));

      expect(getPendingRent(tronAccount.id)).toMatchObject({
        mainAccountId: tronAccount.id,
        orderId: "order-1",
        payerAddress: "TPayer",
        paymentTxId: "txA",
        receiverAddress: "TReceiver",
        energyNeeded: 64_285n,
      });
    });

    it("should remember it without filing the op when the provider reported it failed", async () => {
      const reservePendingOperation = jest.fn();
      const { result } = renderSession({}, reservePendingOperation);
      await waitFor(() => expect(result.current.seam).toBe(seam));

      act(() => lastBroadcastCallback()({ ...BROADCAST, reportedFailed: true }));

      expect(reservePendingOperation).not.toHaveBeenCalled();
      expect(getPendingRent(tronAccount.id)?.paymentTxId).toBe("txA");
    });

    it("remembers it even when no reservation op can be filed", async () => {
      const reservePendingOperation = jest.fn();
      const { result } = renderSession({}, reservePendingOperation);
      await waitFor(() => expect(result.current.seam).toBe(seam));

      act(() => lastBroadcastCallback()({ ...BROADCAST, ...FOREIGN_FEE_ASSET }));

      expect(reservePendingOperation).not.toHaveBeenCalled();
      expect(getPendingRent(tronAccount.id)?.paymentTxId).toBe("txA");
    });

    it("remembers a payment once, so a repeat can't revive a cleared rent", async () => {
      const { result } = renderSession();
      await waitFor(() => expect(result.current.seam).toBe(seam));

      act(() => lastBroadcastCallback()(BROADCAST));
      clearPendingRent(tronAccount.id);
      act(() => lastBroadcastCallback()(BROADCAST));

      expect(getPendingRent(tronAccount.id)).toBeNull();
    });

    it.each([
      ["no payment id", { paymentTxId: undefined }],
      ["no receiver", { receiverAddress: null }],
      ["no energy amount", { energyNeeded: null }],
    ])("remembers nothing for %s", async (_label, overrides) => {
      const { result } = renderSession();
      await waitFor(() => expect(result.current.seam).toBe(seam));

      act(() => lastBroadcastCallback()({ ...BROADCAST, ...overrides }));

      expect(getPendingRent(tronAccount.id)).toBeNull();
    });

    it("remembers the rent before filing the op, so an op that throws can't skip it", async () => {
      const reservePendingOperation = jest.fn(() => {
        throw new Error("store down");
      });
      const { result } = renderSession({}, reservePendingOperation);
      await waitFor(() => expect(result.current.seam).toBe(seam));

      expect(() => lastBroadcastCallback()(BROADCAST)).toThrow("store down");

      expect(getPendingRent(tronAccount.id)?.paymentTxId).toBe("txA");
    });

    it("forgets the rent once its transfer is released", async () => {
      const { result, rerender } = renderSession();
      await waitFor(() => expect(result.current.seam).toBe(seam));
      act(() => lastBroadcastCallback()(BROADCAST));

      setOrchestrationState({ phase: SPONSORED_PHASE.TRANSFER, paymentTxId: "txOther" });
      rerender({ enabled: true, transaction: makeTransaction() });
      expect(getPendingRent(tronAccount.id)).not.toBeNull();

      setOrchestrationState({ phase: SPONSORED_PHASE.TRANSFER, paymentTxId: "txA" });
      rerender({ enabled: true, transaction: makeTransaction() });
      expect(getPendingRent(tronAccount.id)).toBeNull();
    });

    it("holds the offer when an edit sends a paid flow back to IDLE", async () => {
      const transaction = makeTransaction();
      setOrchestrationState({ phase: SPONSORED_PHASE.POLLING, paymentTxId: "txA" });
      const { result, rerender } = renderSession({ transaction });
      await waitFor(() => expect(result.current.seam).toBe(seam));

      act(() => lastBroadcastCallback()(BROADCAST));
      expect(result.current.rentArriving).toBe(false);

      setOrchestrationState({ phase: SPONSORED_PHASE.IDLE, paymentTxId: null });
      rerender({ enabled: true, transaction });

      await waitFor(() => expect(result.current.rentArriving).toBe(true));
      expect(result.current.rentDeliveredAt).toBeNull();
    });

    it("holds the offer when the broadcast lands after a reset already returned to IDLE", async () => {
      setOrchestrationState({ phase: SPONSORED_PHASE.IDLE, paymentTxId: null });
      const { result } = renderSession();
      await waitFor(() => expect(result.current.seam).toBe(seam));
      expect(result.current.rentArriving).toBe(false);

      act(() => lastBroadcastCallback()(BROADCAST));

      await waitFor(() => expect(result.current.rentArriving).toBe(true));
    });

    describe("a payment the provider reported failed", () => {
      const FAILED = {
        phase: SPONSORED_PHASE.FAILED,
        order: { orderId: "order-1", paymentExpiresAt: BROADCAST.paymentExpiresAt },
        paymentTxId: "txA",
        payerAddress: "TPayer",
        receiverAddress: "TReceiver",
        energyNeeded: 64_285n,
        retryLockedUntil: BROADCAST.paymentExpiresAt + 30_000,
      };

      it("is remembered, and holds the offer once the flow returns to IDLE", async () => {
        const reservePendingOperation = jest.fn();
        setOrchestrationState(FAILED);
        const { result, rerender } = renderSession({}, reservePendingOperation);
        await waitFor(() => expect(result.current.seam).toBe(seam));

        expect(getPendingRent(tronAccount.id)).toEqual({
          mainAccountId: tronAccount.id,
          orderId: "order-1",
          payerAddress: "TPayer",
          paymentTxId: "txA",
          receiverAddress: "TReceiver",
          energyNeeded: 64_285n,
          expiresAt: BROADCAST.paymentExpiresAt + PENDING_RENT_EXPIRY_MARGIN_MS,
        });
        expect(reservePendingOperation).not.toHaveBeenCalled();
        expect(result.current.rentArriving).toBe(false);

        setOrchestrationState({ phase: SPONSORED_PHASE.IDLE, paymentTxId: null });
        rerender({ enabled: true, transaction: makeTransaction() });

        await waitFor(() => expect(result.current.rentArriving).toBe(true));
      });

      it.each([
        ["no retry lock", { retryLockedUntil: null }],
        ["a phase other than FAILED", { phase: SPONSORED_PHASE.POLLING }],
        ["no order", { order: null }],
        ["no payment id", { paymentTxId: null }],
        ["no payer", { payerAddress: null }],
        ["no receiver", { receiverAddress: null }],
        ["no energy amount", { energyNeeded: null }],
      ])("is not remembered with %s", async (_label, overrides) => {
        setOrchestrationState({ ...FAILED, ...overrides });
        const { result } = renderSession();
        await waitFor(() => expect(result.current.seam).toBe(seam));

        expect(getPendingRent(tronAccount.id)).toBeNull();
      });

      it("shares its dedupe with the broadcast, so it can't revive a cleared rent", async () => {
        const { result, rerender } = renderSession();
        await waitFor(() => expect(result.current.seam).toBe(seam));
        act(() => lastBroadcastCallback()(BROADCAST));
        clearPendingRent(tronAccount.id);

        setOrchestrationState(FAILED);
        rerender({ enabled: true, transaction: makeTransaction() });

        expect(getPendingRent(tronAccount.id)).toBeNull();
      });
    });

    it("surfaces a rent still pending when Send reopens, and when its energy lands", async () => {
      const { orderId, payerAddress, paymentTxId, receiverAddress, energyNeeded } = BROADCAST;
      recordPendingRent(
        {
          mainAccountId: tronAccount.id,
          orderId,
          payerAddress,
          paymentTxId,
          receiverAddress,
          energyNeeded,
        },
        BROADCAST.paymentExpiresAt,
      );
      setOrchestrationState({ phase: SPONSORED_PHASE.IDLE, paymentTxId: null });
      const delivery = deferred<void>();
      seam.awaitEnergyDelivery.mockReturnValue(delivery.promise);
      const { result } = renderSession();

      await waitFor(() => expect(seam.awaitEnergyDelivery).toHaveBeenCalled());
      expect(result.current.rentArriving).toBe(true);
      expect(result.current.rentDeliveredAt).toBeNull();

      act(() => delivery.resolve());

      await waitFor(() => expect(result.current.rentArriving).toBe(false));
      expect(result.current.rentDeliveredAt).toEqual(expect.any(Number));
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
