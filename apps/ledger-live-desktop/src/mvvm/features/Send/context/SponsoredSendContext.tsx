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
import type { Account, Operation, TokenAccount } from "@ledgerhq/types-live";
import { BigNumber } from "bignumber.js";
import { formatCurrencyUnit } from "@ledgerhq/live-currency-format";
import { useFeature } from "@features/platform-feature-flags";
import type { SponsoredSendActions } from "@ledgerhq/live-common/flows/send/sponsored/useSponsoredSendOrchestration";
import { useSponsoredSendSession } from "@ledgerhq/live-common/flows/send/sponsored/useSponsoredSendSession";
import { useSponsoredFeeQuote } from "@ledgerhq/live-common/flows/send/sponsored/useSponsoredFeeQuote";
import {
  SPONSORED_PHASE,
  type SponsoredState,
} from "@ledgerhq/live-common/flows/send/sponsored/types";
import type { SponsoredFeeQuote } from "@ledgerhq/live-common/bridge/generic-coin-framework/sponsored";
import { addPendingOperation } from "@ledgerhq/live-common/account/index";
import { sponsoredMaxAmount } from "@ledgerhq/live-common/flows/send/sponsored/feeAsset";
import { useDispatch, useSelector } from "LLD/hooks/redux";
import { updateAccountWithUpdater } from "~/renderer/actions/accounts";
import { counterValueCurrencySelector, localeSelector } from "~/renderer/reducers/settings";
import { useMaybeAccountUnit } from "~/renderer/hooks/useAccountUnit";
import { useSendFlowData, useSendFlowActions } from "./SendFlowContext";
import { formatSponsoredFeeAmounts } from "../utils/sponsoredFeeAmounts";
import type { SponsoredFeeAmounts } from "../types";

export const STANDARD_FEE_OPTION_ID = "standard";

type SponsoredSendContextValue = Readonly<{
  state: SponsoredState;
  actions: SponsoredSendActions;
  mainAccount: Account | null;
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

  const reduxDispatch = useDispatch();
  const reservePendingOperation = useCallback(
    (mainAccountId: string, op: Operation) => {
      reduxDispatch(
        updateAccountWithUpdater(mainAccountId, (acc: Account) => addPendingOperation(acc, op)),
      );
    },
    [reduxDispatch],
  );

  const {
    mainAccount,
    seam,
    intent,
    intentFailed,
    state: sponsoredState,
    actions,
  } = useSponsoredSendSession({
    enabled: flagEnabled,
    account,
    parentAccount,
    transaction,
    reservePendingOperation,
  });

  const counterValueCurrency = useSelector(counterValueCurrencySelector);
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
  } = useSponsoredFeeQuote({
    mainAccount,
    seam,
    intent,
    intentFailed,
    refresh: sponsoredState.phase === SPONSORED_PHASE.IDLE,
    counterValueCurrency,
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

  const providerName = seam?.providerName ?? "";
  const waivesErrorKeys = seam?.waivesErrorKeys ?? NO_WAIVED_KEYS;
  const waivesWarningKeys = seam?.waivesWarningKeys ?? NO_WAIVED_KEYS;

  const value = useMemo(
    () => ({
      state: sponsoredState,
      actions,
      mainAccount,
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
      mainAccount,
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
