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
import type { SponsoredSendActions } from "@ledgerhq/live-common/flows/send/sponsored/useSponsoredSendOrchestration";
import { useSponsoredSendSession } from "@ledgerhq/live-common/flows/send/sponsored/useSponsoredSendSession";
import { useSponsoredFeeQuote } from "@ledgerhq/live-common/flows/send/sponsored/useSponsoredFeeQuote";
import {
  SPONSORED_PHASE,
  type SponsoredState,
} from "@ledgerhq/live-common/flows/send/sponsored/types";
import type { SponsoredFeeQuote } from "@ledgerhq/live-common/bridge/generic-coin-framework/sponsored";
import { addPendingOperation } from "@ledgerhq/live-common/account/index";
import {
  STANDARD_FEE_OPTION_ID,
  useSponsoredFeeSelection,
} from "@ledgerhq/live-common/flows/send/sponsored/useSponsoredFeeSelection";
import { useSponsoredFeeAmounts } from "@ledgerhq/live-common/flows/send/sponsored/useSponsoredFeeAmounts";
import { useDispatch, useSelector } from "LLD/hooks/redux";
import { updateAccountWithUpdater } from "~/renderer/actions/accounts";
import { counterValueCurrencySelector, localeSelector } from "~/renderer/reducers/settings";
import { useMaybeAccountUnit } from "~/renderer/hooks/useAccountUnit";
import { useSendFlowData, useSendFlowActions } from "./SendFlowContext";
import type { SponsoredFeeAmounts } from "../types";

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
  /** The sponsored pick can't pay the amount and the rent from the fee token. */
  sponsoredUnaffordable: boolean;
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

  const sponsoredFeeOptionId = seam?.feeOptionId ?? "";
  const selection = useSponsoredFeeSelection({
    sponsoredFeeOptionId,
    available,
    quote,
    feeTokenAccount,
    account,
    transaction,
    updateTransaction: transactionActions.updateTransaction,
  });
  const { selectedFeeOptionId, selectStandard } = selection;

  const locale = useSelector(localeSelector);
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
      ...selection,
      ...feeAmounts,
      sponsoredFeeOptionId,
      providerName,
      waivesErrorKeys,
      waivesWarningKeys,
      available,
      intentReady: intent !== null,
      quote,
      feeCurrencyTicker,
      feeTokenAccount,
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
      available,
      intent,
      quote,
      feeCurrencyTicker,
      feeTokenAccount,
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
