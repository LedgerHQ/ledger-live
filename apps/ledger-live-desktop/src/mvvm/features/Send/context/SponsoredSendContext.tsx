import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { Account, TokenAccount } from "@ledgerhq/types-live";
import { BigNumber } from "bignumber.js";
import { formatCurrencyUnit } from "@ledgerhq/live-currency-format";
import { useFeature } from "@features/platform-feature-flags";
import {
  useSponsoredSendOrchestration,
  type SponsoredSendActions,
} from "@ledgerhq/live-common/flows/send/sponsored/useSponsoredSendOrchestration";
import {
  SPONSORED_PHASE,
  type SponsoredState,
} from "@ledgerhq/live-common/flows/send/sponsored/types";
import { buildGenericTransactionIntent } from "@ledgerhq/live-common/bridge/generic-coin-framework/buildIntent";
import {
  getSponsoredCoinApi,
  type RentPayment,
  type SponsoredCoinApi,
  type SponsoredFeeQuote,
} from "@ledgerhq/live-common/bridge/generic-coin-framework/sponsored";
import type { GenericTransaction } from "@ledgerhq/live-common/bridge/generic-coin-framework/types";
import { addPendingOperation } from "@ledgerhq/live-common/account/index";
import { getMainAccount } from "@ledgerhq/ledger-wallet-framework/account/helpers";
import { useDispatch, useSelector } from "LLD/hooks/redux";
import { updateAccountWithUpdater } from "~/renderer/actions/accounts";
import { counterValueCurrencySelector, localeSelector } from "~/renderer/reducers/settings";
import { useMaybeAccountUnit } from "~/renderer/hooks/useAccountUnit";
import { useSendFlowData, useSendFlowActions } from "./SendFlowContext";
import { useSponsoredFee } from "../hooks/useSponsoredFee";
import { buildRentReservationOperation } from "../utils/rentReservation";
import { formatSponsoredFeeAmounts } from "../utils/sponsoredFeeAmounts";
import { findFeeTokenAccount, sponsoredMaxAmount } from "../utils/sponsoredFeeAsset";
import type { SponsoredFeeAmounts } from "../types";

const SEAM_KIND = "local";

export const STANDARD_FEE_OPTION_ID = "standard";

type SponsoredSendContextValue = Readonly<{
  state: SponsoredState;
  actions: SponsoredSendActions;
  selectedFeeOptionId: string;
  sponsoredFeeOptionId: string;
  providerName: string;
  waivesErrorKeys: readonly string[];
  waivesWarningKeys: readonly string[];
  selectSponsored: () => void;
  selectStandard: () => void;
  available: boolean;
  /** `available` stays true while the intent rebuilds; gate rent-signing on this instead. */
  intentReady: boolean;
  quote: SponsoredFeeQuote | null;
  sponsoredFeeAmounts: SponsoredFeeAmounts | null;
  savingsFiatFormatted: string | null;
  feeCurrencyTicker: string;
  /** The sub-account the sponsored fee is paid from; null when the account holds none. */
  feeTokenAccount: TokenAccount | null;
  /** Largest amount the fee token covers next to the rent; ≤ 0 when nothing fits, null until quoted. */
  sponsoredMaxAmount: BigNumber | null;
}>;

const NO_WAIVED_KEYS: readonly string[] = [];

const SponsoredSendContext = createContext<SponsoredSendContextValue | null>(null);

export function SponsoredSendProvider({ children }: Readonly<{ children: ReactNode }>) {
  const { state } = useSendFlowData();
  const { transaction: transactionActions } = useSendFlowActions();
  const account = state.account.account;
  const parentAccount = state.account.parentAccount;
  const transaction = state.transaction.transaction;
  const flagEnabled = useFeature("gasSponsorship")?.enabled === true;

  const mainAccount = useMemo(
    () => (account ? getMainAccount(account, parentAccount) : null),
    [account, parentAccount],
  );
  const network = mainAccount?.currency.id ?? "";

  const [seam, setSeam] = useState<SponsoredCoinApi | null>(null);
  useEffect(() => {
    let ignore = false;
    setSeam(null);
    if (!flagEnabled || !network) return;
    getSponsoredCoinApi(network, SEAM_KIND).then(
      resolved => {
        if (!ignore) setSeam(resolved);
      },
      () => {
        if (!ignore) setSeam(null);
      },
    );
    return () => {
      ignore = true;
    };
  }, [flagEnabled, network]);

  const [intent, setIntent] = useState<unknown>(null);

  useEffect(() => {
    let ignore = false;

    if (!flagEnabled || !mainAccount || !transaction || !seam) {
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
          transaction as unknown as GenericTransaction,
        );
        if (!ignore) setIntent(result);
      } catch {
        // The builder rejects a mid-edit transaction.
        if (!ignore) setIntent(null);
      }
    })();

    return () => {
      ignore = true;
    };
  }, [flagEnabled, mainAccount, transaction, seam]);

  const reduxDispatch = useDispatch();

  // Fired from the in-flight submit, even after a reset/unmount; dedupe by paymentTxId so a payment locks once.
  const reservedTxIdsRef = useRef<Set<string>>(new Set());
  const handleRentPaymentBroadcast = useCallback(
    ({
      paymentTxId,
      payerAddress,
      rentPayment,
    }: {
      paymentTxId?: string;
      payerAddress: string;
      rentPayment: RentPayment;
    }) => {
      if (!mainAccount || !seam || !paymentTxId || reservedTxIdsRef.current.has(paymentTxId))
        return;
      const tokenAccount = findFeeTokenAccount(mainAccount, rentPayment.asset);
      if (!tokenAccount) return;
      const op = buildRentReservationOperation({
        tokenAccountId: tokenAccount.id,
        payerAddress,
        paymentTxId,
        rentAmount: rentPayment.amount,
        reservationSequence: seam.reservationDedupKey(paymentTxId),
      });
      if (!op) return;
      reservedTxIdsRef.current.add(paymentTxId);
      // Dispatched on the parent: addPendingOperation files the op under the sub-account it names.
      reduxDispatch(
        updateAccountWithUpdater(mainAccount.id, (acc: Account) => addPendingOperation(acc, op)),
      );
    },
    [mainAccount, seam, reduxDispatch],
  );

  const { state: sponsoredState, actions } = useSponsoredSendOrchestration({
    network,
    kind: SEAM_KIND,
    intent,
    onRentPaymentBroadcast: handleRentPaymentBroadcast,
  });

  const sponsoredFeeOptionId = seam?.feeOptionId ?? "";
  const [selectedFeeOptionId, setSelectedFeeOptionId] = useState<string>(STANDARD_FEE_OPTION_ID);
  const snappedAmountRef = useRef<BigNumber | null>(null);

  // `sponsored` makes getPendingNativeSpent skip the native fee on the optimistic op; crafting ignores it.
  const selectSponsored = useCallback(() => {
    if (!sponsoredFeeOptionId) return;
    setSelectedFeeOptionId(sponsoredFeeOptionId);
    transactionActions.updateTransaction(tx => ({ ...tx, sponsored: true }) as typeof tx);
  }, [sponsoredFeeOptionId, transactionActions]);
  // Restores Max only while the amount is still the one the sponsored option snapped it to.
  const selectStandard = useCallback(() => {
    setSelectedFeeOptionId(STANDARD_FEE_OPTION_ID);
    const snapped = snappedAmountRef.current;
    snappedAmountRef.current = null;
    transactionActions.updateTransaction(
      tx =>
        (snapped !== null && !tx.useAllAmount && tx.amount.eq(snapped)
          ? { ...tx, sponsored: false, useAllAmount: true, amount: new BigNumber(0) }
          : { ...tx, sponsored: false }) as typeof tx,
    );
  }, [transactionActions]);

  const {
    available,
    quote,
    savingsFiat,
    standardFeeFiat,
    sponsoredFeeFiat,
    feeCurrencyTicker,
    feeTokenAccount,
  } = useSponsoredFee({
    mainAccount,
    seam,
    intent,
  });

  const sponsoredSelected = selectedFeeOptionId === sponsoredFeeOptionId;
  const maxAmountWithRent = useMemo(
    () => (quote && feeTokenAccount ? sponsoredMaxAmount(feeTokenAccount, quote.value) : null),
    [quote, feeTokenAccount],
  );
  const sendsFeeToken = !!feeTokenAccount && account?.id === feeTokenAccount.id;
  const maxSelected = transaction?.useAllAmount === true;

  // Crafting refuses a Max send, so Max snaps to what the fee token leaves after the rent and its
  // margin. The snap turns Max off, so a later quote never moves the amount under the user.
  useEffect(() => {
    if (!sponsoredSelected || !available || !maxSelected || !sendsFeeToken) return;
    if (!maxAmountWithRent?.gt(0)) return;
    const snapped = maxAmountWithRent;
    snappedAmountRef.current = snapped;
    transactionActions.updateTransaction(
      tx => ({ ...tx, useAllAmount: false, amount: snapped }) as typeof tx,
    );
  }, [
    sponsoredSelected,
    available,
    maxSelected,
    sendsFeeToken,
    maxAmountWithRent,
    transactionActions,
  ]);

  const counterValueCurrency = useSelector(counterValueCurrencySelector);
  const locale = useSelector(localeSelector);
  const savingsFiatFormatted = useMemo(
    () =>
      savingsFiat?.gt(0)
        ? formatCurrencyUnit(counterValueCurrency.units[0], savingsFiat, {
            showCode: true,
            disableRounding: true,
            locale,
          })
        : null,
    [savingsFiat, counterValueCurrency, locale],
  );

  const nativeUnit = useMaybeAccountUnit(mainAccount);
  const sponsoredFeeAmounts = useMemo(() => {
    const feeUnit = quote?.feeAsset.unit;
    if (!quote || !feeUnit || !nativeUnit) return null;
    return formatSponsoredFeeAmounts({
      quote,
      feeUnit,
      nativeUnit,
      fiatUnit: counterValueCurrency.units[0],
      sponsoredFeeFiat,
      standardFeeFiat,
      locale,
    });
  }, [quote, nativeUnit, counterValueCurrency, sponsoredFeeFiat, standardFeeFiat, locale]);

  // IDLE only: once TX-A is paid, fee options drop to standard-only, and reverting would re-craft TX-C.
  const sponsoredSelectionStale =
    sponsoredState.phase === SPONSORED_PHASE.IDLE &&
    selectedFeeOptionId !== STANDARD_FEE_OPTION_ID &&
    (!flagEnabled || !available || selectedFeeOptionId !== sponsoredFeeOptionId);
  useEffect(() => {
    if (sponsoredSelectionStale) selectStandard();
  }, [sponsoredSelectionStale, selectStandard]);

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

  const providerName = seam?.providerName ?? "";
  const waivesErrorKeys = seam?.waivesErrorKeys ?? NO_WAIVED_KEYS;
  const waivesWarningKeys = seam?.waivesWarningKeys ?? NO_WAIVED_KEYS;

  const value = useMemo(
    () => ({
      state: sponsoredState,
      actions,
      selectedFeeOptionId,
      sponsoredFeeOptionId,
      providerName,
      waivesErrorKeys,
      waivesWarningKeys,
      selectSponsored,
      selectStandard,
      available,
      intentReady: intent !== null,
      quote,
      sponsoredFeeAmounts,
      savingsFiatFormatted,
      feeCurrencyTicker,
      feeTokenAccount,
      sponsoredMaxAmount: maxAmountWithRent,
    }),
    [
      sponsoredState,
      actions,
      selectedFeeOptionId,
      sponsoredFeeOptionId,
      providerName,
      waivesErrorKeys,
      waivesWarningKeys,
      selectSponsored,
      selectStandard,
      available,
      intent,
      quote,
      sponsoredFeeAmounts,
      savingsFiatFormatted,
      feeCurrencyTicker,
      feeTokenAccount,
      maxAmountWithRent,
    ],
  );

  return <SponsoredSendContext.Provider value={value}>{children}</SponsoredSendContext.Provider>;
}

export function useSponsoredSend(): SponsoredSendContextValue {
  const context = useContext(SponsoredSendContext);
  if (!context) {
    throw new Error("useSponsoredSend must be used within a SponsoredSendProvider");
  }
  return context;
}
