import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Account, Operation } from "@ledgerhq/types-live";
import { useFeature } from "@features/platform-feature-flags";
import { addPendingOperation } from "@ledgerhq/live-common/account/index";
import { isSponsoredFeeUnaffordable } from "@ledgerhq/live-common/flows/send/sponsored/feeAsset";
import {
  SPONSORED_PHASE,
  type SponsoredPhase,
  type SponsoredState,
} from "@ledgerhq/live-common/flows/send/sponsored/types";
import { useSponsoredFeeQuote } from "@ledgerhq/live-common/flows/send/sponsored/useSponsoredFeeQuote";
import type { SponsoredSendActions } from "@ledgerhq/live-common/flows/send/sponsored/useSponsoredSendOrchestration";
import { useSponsoredSendSession } from "@ledgerhq/live-common/flows/send/sponsored/useSponsoredSendSession";
import { useDispatch, useSelector } from "~/context/hooks";
import { updateAccountWithUpdater } from "~/actions/accounts";
import { counterValueCurrencySelector } from "~/reducers/settings";
import { useSendFlowActions, useSendFlowData } from "./SendFlowContext";
import { useSendSignature } from "./SendSignatureContext";

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
  /** The sponsored pick pays the native fee, so the status entries it waives don't apply. */
  waivesNativeFee: boolean;
  /** False while Review has to wait for the sponsored pick's intent and quote. */
  reviewReady: boolean;
  feeCurrencyTicker: string;
}>;

const NO_WAIVED_KEYS: readonly string[] = [];

/**
 * Mobile has no fee picker until LIVE-33403, so the sponsored fee is picked whenever it can pay
 * for the send. Null keeps the current pick: from Review on, and while the quote reloads.
 */
export function pickAutoFeeOption({
  phase,
  signing,
  sponsoredFeeOptionId,
  available,
  quoted,
  useAllAmount,
  unaffordable,
}: Readonly<{
  phase: SponsoredPhase;
  signing: boolean;
  sponsoredFeeOptionId: string;
  available: boolean;
  quoted: boolean;
  useAllAmount: boolean;
  unaffordable: boolean;
}>): string | null {
  if (signing || phase !== SPONSORED_PHASE.IDLE) return null;
  if (!sponsoredFeeOptionId || !available) return STANDARD_FEE_OPTION_ID;
  if (!quoted) return null;
  // Crafting refuses a Max send.
  if (useAllAmount || unaffordable) return STANDARD_FEE_OPTION_ID;
  return sponsoredFeeOptionId;
}

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
  const { available, quote, feeCurrencyTicker, feeTokenAccount } = useSponsoredFeeQuote({
    mainAccount,
    seam,
    intent,
    intentFailed,
    counterValueCurrency,
  });

  const sponsoredFeeOptionId = seam?.feeOptionId ?? "";
  const [selectedFeeOptionId, setSelectedFeeOptionId] = useState(STANDARD_FEE_OPTION_ID);

  const unaffordable = useMemo(
    () =>
      !!quote &&
      !!account &&
      !!transaction &&
      isSponsoredFeeUnaffordable({ account, transaction, feeTokenAccount, rentValue: quote.value }),
    [quote, account, transaction, feeTokenAccount],
  );
  const autoFeeOptionId = pickAutoFeeOption({
    phase: sponsoredState.phase,
    signing: isSigning,
    sponsoredFeeOptionId,
    available,
    quoted: !!quote,
    useAllAmount: transaction?.useAllAmount === true,
    unaffordable,
  });

  // `sponsored` makes getPendingNativeSpent skip the native fee on the optimistic op; crafting ignores it.
  useEffect(() => {
    if (autoFeeOptionId === null || autoFeeOptionId === selectedFeeOptionId) return;
    setSelectedFeeOptionId(autoFeeOptionId);
    const sponsored = autoFeeOptionId !== STANDARD_FEE_OPTION_ID;
    transactionActions.updateTransaction(tx => ({ ...tx, sponsored }) as typeof tx);
  }, [autoFeeOptionId, selectedFeeOptionId, transactionActions]);

  // Once the transfer's overlay closes on DONE, the next Review is a new sponsored send.
  const phase = sponsoredState.phase;
  useEffect(() => {
    if (phase === SPONSORED_PHASE.DONE && !isSigning) actions.reset();
  }, [phase, isSigning, actions]);

  const sponsoredSelected = !!sponsoredFeeOptionId && selectedFeeOptionId === sponsoredFeeOptionId;
  // Past IDLE, TX-A is under way or paid and Review only reopens TX-C: the live quote is moot.
  const committed = phase !== SPONSORED_PHASE.IDLE;
  const reviewReady = !sponsoredSelected || committed || (available && intent !== null && !!quote);
  const waivesNativeFee = sponsoredSelected && (committed || available);

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
      waivesNativeFee,
      reviewReady,
      feeCurrencyTicker,
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
      waivesNativeFee,
      reviewReady,
      feeCurrencyTicker,
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
  const { selectedFeeOptionId, sponsoredFeeOptionId } = useSponsoredSend();
  return !!sponsoredFeeOptionId && selectedFeeOptionId === sponsoredFeeOptionId;
}
