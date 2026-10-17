import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  type ReactNode,
} from "react";
import type { Account, Operation, TokenAccount } from "@ledgerhq/types-live";
import type { BigNumber } from "bignumber.js";
import { useFeature } from "@features/platform-feature-flags";
import { track } from "@shared/analytics";
import { addPendingOperation } from "@ledgerhq/live-common/account/index";
import {
  SPONSORED_PHASE,
  type SponsoredFeeAmounts,
  type SponsoredState,
} from "@ledgerhq/live-common/flows/send/sponsored/types";
import { useSponsoredFeeQuote } from "@ledgerhq/live-common/flows/send/sponsored/useSponsoredFeeQuote";
import { useSponsoredSendFunnelTracking } from "@ledgerhq/live-common/flows/send/sponsored/useSponsoredSendFunnelTracking";
import type { SponsoredSendActions } from "@ledgerhq/live-common/flows/send/sponsored/useSponsoredSendOrchestration";
import { useSponsoredSendSession } from "@ledgerhq/live-common/flows/send/sponsored/useSponsoredSendSession";
import { useSponsoredFeeAmounts } from "@ledgerhq/live-common/flows/send/sponsored/useSponsoredFeeAmounts";
import { formatRentPayment } from "@ledgerhq/live-common/flows/send/sponsored/feeAsset";
import {
  STANDARD_FEE_OPTION_ID,
  useSponsoredFeeSelection,
} from "@ledgerhq/live-common/flows/send/sponsored/useSponsoredFeeSelection";
import { useDispatch, useSelector } from "~/context/hooks";
import { useLocale } from "~/context/Locale";
import { updateAccountWithUpdater } from "~/actions/accounts";
import { counterValueCurrencySelector } from "~/reducers/settings";
import { useMaybeAccountUnit } from "LLM/hooks/useAccountUnit";
import { useSendFlowActions, useSendFlowData } from "./SendFlowContext";
import { useSendSignature } from "./SendSignatureContext";
import { useSendFlowTracking } from "./SendFlowTrackingContext";
import { useSendFlowTrackingProperties } from "../hooks/useSendFlowTrackingProperties";

export { STANDARD_FEE_OPTION_ID };

type SponsoredSendContextValue = Readonly<{
  state: SponsoredState;
  actions: SponsoredSendActions;
  mainAccount: Account | null;
  selectedFeeOptionId: string;
  sponsoredSelected: boolean;
  sponsoredFeeOptionId: string;
  providerName: string;
  waivesErrorKeys: readonly string[];
  waivesWarningKeys: readonly string[];
  /** The sponsored pick pays the native fee, so the status entries it waives don't apply. */
  waivesNativeFee: boolean;
  /** False while Review has to wait for the sponsored pick's intent and quote. */
  reviewReady: boolean;
  /** Past IDLE on the sponsored pick: TX-A is under way or paid, so the pick outlives the live option. */
  sponsoredCommitted: boolean;
  /** The rent TX-A pays, shown for a committed pick in place of the live quote; null until crafted. */
  committedRentFee: string | null;
  feeCurrencyTicker: string;
  selectSponsored: () => void;
  selectStandard: () => void;
  available: boolean;
  sponsoredFeeAmounts: SponsoredFeeAmounts | null;
  savingsFiatFormatted: string | null;
  /** The sub-account the sponsored fee is paid from; null when the account holds none. */
  feeTokenAccount: TokenAccount | null;
  /** Largest amount the fee token covers next to the rent; ≤ 0 when nothing fits, null until quoted. */
  sponsoredMaxAmount: BigNumber | null;
  /** The sponsored pick can't pay the amount and the rent from the fee token. */
  sponsoredUnaffordable: boolean;
  approvedFee: bigint | null;
}>;

const NO_WAIVED_KEYS: readonly string[] = [];

const SponsoredSendContext = createContext<SponsoredSendContextValue | null>(null);

export function SponsoredSendProvider({ children }: Readonly<{ children: ReactNode }>) {
  const { state } = useSendFlowData();
  const { transaction: transactionActions } = useSendFlowActions();
  const { isSigning } = useSendSignature();
  const account = state.account.account;
  const parentAccount = state.account.parentAccount;
  const transaction = state.transaction.transaction;
  const flagEnabled = useFeature("gasSponsorship")?.enabled === true;

  const reduxDispatch = useDispatch();
  const reservePendingOperation = useCallback(
    (mainAccountId: string, op: Operation) => {
      reduxDispatch(
        updateAccountWithUpdater({
          accountId: mainAccountId,
          updater: (acc: Account) => addPendingOperation(acc, op),
        }),
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
  const {
    available,
    quote,
    savingsFiat,
    standardFeeFiat,
    sponsoredFeeFiat,
    feeCurrencyTicker: quoteFeeCurrencyTicker,
    feeTokenAccount,
  } = useSponsoredFeeQuote({
    mainAccount,
    seam,
    intent,
    intentFailed,
    refresh: sponsoredState.phase === SPONSORED_PHASE.IDLE,
    counterValueCurrency,
  });

  const { flowSessionId } = useSendFlowTracking();
  const sendFlowTrackingProperties = useSendFlowTrackingProperties();
  useSponsoredSendFunnelTracking({
    state: sponsoredState,
    provider: seam?.feeOptionId ?? null,
    quote,
    standardFeeFiat,
    sponsoredFeeFiat,
    fiatCurrency: counterValueCurrency,
    flowSessionId,
    properties: sendFlowTrackingProperties,
    track,
  });

  const sponsoredFeeOptionId = seam?.feeOptionId ?? "";
  const selection = useSponsoredFeeSelection({
    sponsoredFeeOptionId,
    available,
    phase: sponsoredState.phase,
    quote,
    feeTokenAccount,
    account,
    transaction,
    updateTransaction: transactionActions.updateTransaction,
  });
  const { selectedFeeOptionId, sponsoredSelected, selectStandard, resetSelection } = selection;

  const { locale } = useLocale();
  const nativeUnit = useMaybeAccountUnit(mainAccount);
  const feeAmounts = useSponsoredFeeAmounts({
    quote,
    nativeUnit,
    fiatUnit: counterValueCurrency.units[0],
    savingsFiat,
    sponsoredFeeFiat,
    standardFeeFiat,
    locale,
  });

  const phase = sponsoredState.phase;
  // IDLE only: once TX-A is paid, fee options drop to standard-only, and reverting would re-craft
  // TX-C. Not while signing either: Review already runs on the pick.
  const sponsoredSelectionStale =
    phase === SPONSORED_PHASE.IDLE &&
    !isSigning &&
    selectedFeeOptionId !== STANDARD_FEE_OPTION_ID &&
    (!flagEnabled || !available || selectedFeeOptionId !== sponsoredFeeOptionId);
  useEffect(() => {
    if (sponsoredSelectionStale) selectStandard();
  }, [sponsoredSelectionStale, selectStandard]);

  // Once the transfer's overlay closes on DONE, the next Review is a new send, on the standard fee
  // until the user opts in again.
  useEffect(() => {
    if (phase !== SPONSORED_PHASE.DONE || isSigning) return;
    actions.reset();
    resetSelection();
  }, [phase, isSigning, actions, resetSelection]);

  // Past IDLE, TX-A is under way or paid and Review only reopens TX-C: the live quote is moot.
  const committed = phase !== SPONSORED_PHASE.IDLE;
  const reviewReady = !sponsoredSelected || committed || (available && intent !== null && !!quote);
  const waivesNativeFee = sponsoredSelected && (committed || available);
  // The live option and its quote can drop once the rented energy lands: show the rent TX-A pays.
  const sponsoredCommitted = sponsoredSelected && committed;
  const rentPayment = sponsoredState.rentPayment;
  const committedRentFee = useMemo(
    () => (sponsoredCommitted && rentPayment ? formatRentPayment(rentPayment, locale) : null),
    [sponsoredCommitted, rentPayment, locale],
  );
  const feeCurrencyTicker = rentPayment?.asset.unit?.code ?? quoteFeeCurrencyTicker;

  const providerName = seam?.providerName ?? "";
  const waivesErrorKeys = seam?.waivesErrorKeys ?? NO_WAIVED_KEYS;
  const waivesWarningKeys = seam?.waivesWarningKeys ?? NO_WAIVED_KEYS;
  const approvedFee = quote?.value ?? null;

  const value = useMemo(
    () => ({
      state: sponsoredState,
      actions,
      mainAccount,
      ...selection,
      ...feeAmounts,
      sponsoredFeeOptionId,
      providerName,
      waivesErrorKeys,
      waivesWarningKeys,
      waivesNativeFee,
      reviewReady,
      sponsoredCommitted,
      committedRentFee,
      feeCurrencyTicker,
      available,
      feeTokenAccount,
      approvedFee,
    }),
    [
      sponsoredState,
      actions,
      mainAccount,
      selection,
      feeAmounts,
      sponsoredFeeOptionId,
      providerName,
      waivesErrorKeys,
      waivesWarningKeys,
      waivesNativeFee,
      reviewReady,
      sponsoredCommitted,
      committedRentFee,
      feeCurrencyTicker,
      available,
      feeTokenAccount,
      approvedFee,
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

/** True while the sponsored fee is the pick, so Review runs TX-A before the transfer. */
export function useIsSponsoredSelected(): boolean {
  return useSponsoredSend().sponsoredSelected;
}
