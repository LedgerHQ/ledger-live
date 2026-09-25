import { useEffect, useMemo, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  joinCardTransactionsPages,
  useGetCardCashbackQuery,
  useGetCardStatusQuery,
  useGetCardTransactionsInfiniteQuery,
} from "@domain/api-card-management";
import { useIsCardSignedIn } from "@features/flow-pay-card-auth";
import { selectPendingLoginType, setPendingLoginType } from "@features/flow-pay-card-auth/state";
import {
  trackCardAddedToOsWallet,
  trackCardClaimed,
  trackCardOnboardingCompleted,
  trackCardOnboardingInProgress,
  trackFirstCardTransaction,
  trackFirstCardTxSync,
  trackSuccessfulCardLogin,
} from "@features/platform-pay-analytics";
import { useCardOnboardingStatus } from "@features/flow-pay-card-widget/onboarding-status";
import {
  markAnalyticsMilestonesReported,
  markCardAccountRead,
  selectAnalyticsCardId,
  selectHasReadCardAccount,
  selectReportedAnalyticsMilestones,
  setAnalyticsCardId,
} from "@features/flow-pay-card-widget/state";
import {
  derivePayCardAnalyticsMilestones,
  type PendingPayCardAnalyticsMilestone,
} from "./derivePayCardAnalyticsMilestones";
import { isPayCardAccountRead } from "./isPayCardAccountRead";
import { planPayCardMilestoneReports } from "./planPayCardMilestoneReports";

function reportMilestone(milestone: PendingPayCardAnalyticsMilestone) {
  switch (milestone.id) {
    case "card-claimed":
      trackCardClaimed();
      return;
    case "card-added-to-os-wallet":
      trackCardAddedToOsWallet();
      return;
    case "first-card-transaction":
      trackFirstCardTransaction({
        cardFundSourceAsset: milestone.cardFundSourceAsset,
      });
      return;
    case "first-card-tx-sync":
      trackFirstCardTxSync({ transaction: milestone.transaction });
      return;
    case "card-onboarding-completed":
      trackCardOnboardingCompleted();
      return;
    case "card-onboarding-in-progress":
      trackCardOnboardingInProgress({
        page: "Pay",
        cardClaimed: milestone.cardClaimed,
        addedToOsWallet: milestone.addedToOsWallet,
        cardTopUp: milestone.cardTopUp,
        firstPurchaseCompleted: milestone.firstPurchaseCompleted,
        stepsCompleted: milestone.stepsCompleted,
      });
  }
}

export function useCardLifecycleTracking() {
  const dispatch = useDispatch();
  const isSignedIn = useIsCardSignedIn();
  const attempted = useRef(new Set<string>());
  const attemptedCardId = useRef<string | null>(null);
  const reported = useSelector(selectReportedAnalyticsMilestones);
  const analyticsCardId = useSelector(selectAnalyticsCardId);
  const hasReadAccount = useSelector(selectHasReadCardAccount);
  const pendingLoginType = useSelector(selectPendingLoginType);
  const {
    data: cardStatus,
    error: cardStatusError,
    isUninitialized: isCardStatusUninitialized,
    isFetching: isCardStatusFetching,
  } = useGetCardStatusQuery(undefined, { skip: !isSignedIn });
  useGetCardCashbackQuery(undefined, { skip: !isSignedIn });
  const { data: transactionPages } = useGetCardTransactionsInfiniteQuery(undefined, {
    skip: !isSignedIn,
  });
  // Still `undefined` until a page lands: the milestones tell "no transactions yet" apart from
  // "not read yet", and an empty array would report the first as the second.
  const transactions = useMemo(
    () => (transactionPages ? joinCardTransactionsPages(transactionPages.pages) : undefined),
    [transactionPages],
  );
  const onboarding = useCardOnboardingStatus({ skip: !isSignedIn });
  const onboardingStatus =
    onboarding.isFetching || onboarding.isError || onboarding.hasSourceError
      ? undefined
      : onboarding.data;
  const isAccountRead = isPayCardAccountRead({
    isSignedIn,
    isCardStatusUninitialized,
    isCardStatusFetching,
    cardStatus,
    cardStatusError,
    transactions,
    onboardingStatus,
  });

  useEffect(() => {
    if (!isSignedIn || !pendingLoginType) return;

    trackSuccessfulCardLogin({ type: pendingLoginType });
    dispatch(setPendingLoginType(null));
  }, [dispatch, isSignedIn, pendingLoginType]);

  useEffect(() => {
    if (!isSignedIn) {
      attempted.current.clear();
      attemptedCardId.current = null;
      return;
    }

    const cardId = cardStatus?.id;
    if (cardId && attemptedCardId.current !== cardId) {
      attempted.current.clear();
      attemptedCardId.current = cardId;
      dispatch(setAnalyticsCardId(cardId));
    }

    if (!isAccountRead) return;
    if (!hasReadAccount) dispatch(markCardAccountRead());
    if (!cardId) return;

    const reportedForCard = cardId === analyticsCardId ? reported : [];
    const { send, record } = planPayCardMilestoneReports({
      observed: derivePayCardAnalyticsMilestones({
        cardStatus,
        transactions,
        onboardingStatus,
      }),
      reported: [...reportedForCard, ...attempted.current],
      isFirstRead: !hasReadAccount || cardId !== analyticsCardId,
    });

    if (!record.length) return;
    for (const id of record) attempted.current.add(id);
    dispatch(markAnalyticsMilestonesReported(record));
    for (const milestone of send) {
      reportMilestone(milestone);
    }
  }, [
    analyticsCardId,
    cardStatus,
    dispatch,
    hasReadAccount,
    isAccountRead,
    isSignedIn,
    onboardingStatus,
    reported,
    transactions,
  ]);
}
