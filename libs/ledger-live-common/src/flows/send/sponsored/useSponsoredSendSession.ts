import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BigNumber } from "bignumber.js";
import { log } from "@ledgerhq/logs";
import type { Account, AccountLike, Operation } from "@ledgerhq/types-live";
import { getMainAccount } from "../../../account/index";
import { buildGenericTransactionIntent } from "../../../bridge/generic-coin-framework/buildIntent";
import { getSponsoredCoinApi } from "../../../bridge/generic-coin-framework/sponsored";
import type {
  RentPayment,
  SponsoredCoinApi,
} from "../../../bridge/generic-coin-framework/sponsored";
import type { GenericTransaction } from "../../../bridge/generic-coin-framework/types";
import type { Transaction } from "../../../generated/types";
import { findFeeTokenAccount } from "./feeAsset";
import { clearPendingRent, recordPendingRent } from "./pendingRents";
import type { PendingRent } from "./pendingRents";
import { buildRentReservationOperation } from "./rentReservation";
import { SPONSORED_PHASE } from "./types";
import type { SponsoredState } from "./types";
import { usePendingRentDelivery } from "./usePendingRentDelivery";
import { useSponsoredSendOrchestration } from "./useSponsoredSendOrchestration";
import type { SponsoredSendActions } from "./useSponsoredSendOrchestration";

const SEAM_KIND = "local";
const LOG_TYPE = "sponsored-send";

export type SponsoredSendIntent = Awaited<ReturnType<typeof buildGenericTransactionIntent>>;

function sameValue(a: unknown, b: unknown): boolean {
  return a === b || (BigNumber.isBigNumber(a) && BigNumber.isBigNumber(b) && a.eq(b));
}

function entriesWithoutSponsored(transaction: Transaction): [string, unknown][] {
  return Object.entries(transaction).filter(([key]) => key !== "sponsored");
}

// The intent leaves out `sponsored`, so toggling the fee pick needn't rebuild it and re-quote.
function differsOnlyInSponsored(
  previous: Transaction | null | undefined,
  next: Transaction | null | undefined,
): boolean {
  if (!previous || !next) return false;
  const previousValues = new Map(entriesWithoutSponsored(previous));
  const nextEntries = entriesWithoutSponsored(next);
  return (
    nextEntries.length === previousValues.size &&
    nextEntries.every(
      ([key, value]) => previousValues.has(key) && sameValue(previousValues.get(key), value),
    )
  );
}

export type UseSponsoredSendSessionParams = Readonly<{
  enabled: boolean;
  account: AccountLike | null | undefined;
  parentAccount: Account | null | undefined;
  transaction: Transaction | null | undefined;
  /** Files an optimistic op on the main account: the app owns the account store. */
  reservePendingOperation: (mainAccountId: string, operation: Operation) => void;
}>;

export type SponsoredSendSession = Readonly<{
  mainAccount: Account | null;
  seam: SponsoredCoinApi | null;
  /** Null while it rebuilds after an edit, and when the builder rejects the transaction. */
  intent: SponsoredSendIntent | null;
  /** The builder rejected the current transaction, so no quote is coming until the next edit. */
  intentFailed: boolean;
  state: SponsoredState;
  actions: SponsoredSendActions;
  /** A rent paid outside the active flow hasn't landed: the sponsored option stays off, or it would pay twice. */
  rentArriving: boolean;
  /** When that rent's energy landed, in ms since epoch. */
  rentDeliveredAt: number | null;
}>;

/** The app-agnostic half of a sponsored send; fee selection and display stay with each app. */
export function useSponsoredSendSession({
  enabled,
  account,
  parentAccount,
  transaction,
  reservePendingOperation,
}: UseSponsoredSendSessionParams): SponsoredSendSession {
  const mainAccount = useMemo(
    () => (account ? getMainAccount(account, parentAccount) : null),
    [account, parentAccount],
  );
  const network = mainAccount?.currency.id ?? "";

  const [seam, setSeam] = useState<SponsoredCoinApi | null>(null);
  useEffect(() => {
    let ignore = false;
    setSeam(null);
    if (!enabled || !network) return;
    getSponsoredCoinApi(network, SEAM_KIND).then(
      resolved => {
        if (!ignore) setSeam(resolved);
      },
      error => {
        log(LOG_TYPE, "sponsored seam failed to load", { network, error });
        if (!ignore) setSeam(null);
      },
    );
    return () => {
      ignore = true;
    };
  }, [enabled, network]);

  const [intentTransaction, setIntentTransaction] = useState(transaction);
  if (
    intentTransaction !== transaction &&
    !differsOnlyInSponsored(intentTransaction, transaction)
  ) {
    setIntentTransaction(transaction);
  }

  const [intent, setIntent] = useState<SponsoredSendIntent | null>(null);
  const [intentFailed, setIntentFailed] = useState(false);
  useEffect(() => {
    let ignore = false;
    setIntentFailed(false);

    if (!enabled || !mainAccount || !intentTransaction || !seam) {
      setIntent(null);
      return;
    }

    // Clear first so Review can't craft against the previous transaction's intent during the rebuild.
    setIntent(null);

    void (async () => {
      try {
        const result = await buildGenericTransactionIntent(
          mainAccount.currency.family,
          SEAM_KIND,
          mainAccount,
          intentTransaction as unknown as GenericTransaction,
        );
        if (!ignore) setIntent(result);
      } catch (error) {
        // The builder rejects a mid-edit transaction.
        log(LOG_TYPE, "sponsored intent build failed", { error });
        if (!ignore) setIntentFailed(true);
      }
    })();

    return () => {
      ignore = true;
    };
  }, [enabled, mainAccount, intentTransaction, seam]);

  // A ref, so an unmemoized reservePendingOperation can't rebuild the orchestration's actions.
  const reservePendingOperationRef = useRef(reservePendingOperation);
  useEffect(() => {
    reservePendingOperationRef.current = reservePendingOperation;
  }, [reservePendingOperation]);

  // Fired from the in-flight submit, even after a reset/unmount; dedupe by paymentTxId so a payment
  // is locked and remembered once.
  const reservedTxIdsRef = useRef<Set<string>>(new Set());
  const recordedTxIdsRef = useRef<Set<string>>(new Set());
  // Kept past the flow, so a reopened Send can't rent again before this one lands.
  const rememberRent = useCallback(
    (rent: Omit<PendingRent, "expiresAt">, paymentExpiresAt: number) => {
      if (recordedTxIdsRef.current.has(rent.paymentTxId)) return;
      recordedTxIdsRef.current.add(rent.paymentTxId);
      recordPendingRent(rent, paymentExpiresAt);
    },
    [],
  );

  const onRentPaymentBroadcast = useCallback(
    ({
      paymentTxId,
      payerAddress,
      rentPayment,
      orderId,
      receiverAddress,
      energyNeeded,
      paymentExpiresAt,
      reportedFailed,
    }: {
      paymentTxId?: string;
      payerAddress: string;
      rentPayment: RentPayment;
      orderId: string;
      receiverAddress: string | null;
      energyNeeded: bigint | null;
      paymentExpiresAt: number;
      reportedFailed?: boolean;
    }) => {
      if (!mainAccount || !paymentTxId) return;

      // First, so a throw in the op path can't skip it.
      if (receiverAddress && energyNeeded != null) {
        rememberRent(
          {
            mainAccountId: mainAccount.id,
            orderId,
            payerAddress,
            paymentTxId,
            receiverAddress,
            energyNeeded,
          },
          paymentExpiresAt,
        );
      }

      // Reported failed, so the rent most likely never left the balance: held above, not locked.
      if (seam && !reportedFailed && !reservedTxIdsRef.current.has(paymentTxId)) {
        const tokenAccount = findFeeTokenAccount(mainAccount, rentPayment.asset);
        const op =
          tokenAccount &&
          buildRentReservationOperation({
            tokenAccountId: tokenAccount.id,
            payerAddress,
            paymentTxId,
            rentAmount: rentPayment.amount,
            reservationSequence: seam.reservationDedupKey(paymentTxId),
          });
        if (op) {
          reservedTxIdsRef.current.add(paymentTxId);
          // Filed on the parent: addPendingOperation routes the op to the sub-account it names.
          reservePendingOperationRef.current(mainAccount.id, op);
        }
      }
    },
    [mainAccount, seam, rememberRent],
  );

  const mainAccountId = mainAccount?.id ?? null;
  const { state, actions } = useSponsoredSendOrchestration({
    network,
    kind: SEAM_KIND,
    intent,
    mainAccountId,
    onRentPaymentBroadcast,
  });

  // The flow saw its own energy land, so the record is spent.
  useEffect(() => {
    if (mainAccountId && state.phase === SPONSORED_PHASE.TRANSFER && state.paymentTxId) {
      clearPendingRent(mainAccountId, state.paymentTxId);
    }
  }, [mainAccountId, state.phase, state.paymentTxId]);

  // A failed payment that may still land (hence the retry lock). The broadcast callback normally
  // remembered it already, for DELIVERY_FAILURE too: this is a deduped backstop.
  useEffect(() => {
    if (
      !mainAccountId ||
      state.phase !== SPONSORED_PHASE.FAILED ||
      state.retryLockedUntil == null
    ) {
      return;
    }
    if (
      !state.order ||
      !state.paymentTxId ||
      !state.payerAddress ||
      !state.receiverAddress ||
      state.energyNeeded == null
    ) {
      return;
    }
    rememberRent(
      {
        mainAccountId,
        orderId: state.order.orderId,
        payerAddress: state.payerAddress,
        paymentTxId: state.paymentTxId,
        receiverAddress: state.receiverAddress,
        energyNeeded: state.energyNeeded,
      },
      state.order.paymentExpiresAt,
    );
  }, [
    mainAccountId,
    state.phase,
    state.retryLockedUntil,
    state.order,
    state.paymentTxId,
    state.payerAddress,
    state.receiverAddress,
    state.energyNeeded,
    rememberRent,
  ]);

  const { rentArriving, deliveredAt: rentDeliveredAt } = usePendingRentDelivery({
    mainAccountId,
    seam,
    idle: state.phase === SPONSORED_PHASE.IDLE,
  });

  // Excludes `sponsored`: toggling the fee option must not discard a crafted order. A max send keys
  // on "max" rather than its amount, which prepareTransaction keeps re-deriving from the balance.
  const rentIntentKey = [
    account?.id,
    parentAccount?.id,
    transaction?.recipient,
    transaction?.useAllAmount ? "max" : transaction?.amount?.toString(),
    transaction?.subAccountId,
  ].join("|");

  // Compared by key: `actions` changes on every intent or account rebuild (e.g. the TX-A
  // reservation), which alone must not reset mid-flow.
  const lastRentIntentKeyRef = useRef(rentIntentKey);
  useEffect(() => {
    if (lastRentIntentKeyRef.current === rentIntentKey) return;
    lastRentIntentKeyRef.current = rentIntentKey;
    actions.reset();
  }, [rentIntentKey, actions]);

  return useMemo(
    () => ({
      mainAccount,
      seam,
      intent,
      intentFailed,
      state,
      actions,
      rentArriving,
      rentDeliveredAt,
    }),
    [mainAccount, seam, intent, intentFailed, state, actions, rentArriving, rentDeliveredAt],
  );
}
