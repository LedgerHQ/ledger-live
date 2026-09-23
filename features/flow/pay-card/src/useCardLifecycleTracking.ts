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
import { usePayAnalyticsContext, type PayAnalyticsHelper } from "@features/platform-pay-analytics";
import { useCardOnboardingStatus } from "@features/flow-pay-card-widget/onboarding-status";
import {
  markAnalyticsMilestonesReported,
  selectAnalyticsCardId,
  selectReportedAnalyticsMilestones,
  setAnalyticsCardId,
} from "@features/flow-pay-card-widget/state";
import {
  derivePayCardAnalyticsMilestones,
  type PendingPayCardAnalyticsMilestone,
} from "./derivePayCardAnalyticsMilestones";

function reportMilestone(
  analytics: PayAnalyticsHelper,
  milestone: PendingPayCardAnalyticsMilestone,
) {
  switch (milestone.id) {
    case "card-claimed":
      analytics.trackCardClaimed();
      return;
    case "card-added-to-os-wallet":
      analytics.trackCardAddedToOsWallet();
      return;
    case "first-card-transaction":
      analytics.trackFirstCardTransaction({
        cardFundSourceAsset: milestone.cardFundSourceAsset,
      });
      return;
    case "first-card-tx-sync":
      analytics.trackFirstCardTxSync({ transaction: milestone.transaction });
      return;
    case "card-onboarding-completed":
      analytics.trackCardOnboardingCompleted();
      return;
    case "card-onboarding-in-progress":
      analytics.trackCardOnboardingInProgress({
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
  const pendingLoginType = useSelector(selectPendingLoginType);
  const analytics = usePayAnalyticsContext();
  const { data: cardStatus } = useGetCardStatusQuery(undefined, { skip: !isSignedIn });
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

  useEffect(() => {
    if (!isSignedIn || !pendingLoginType || !analytics.configured) return;

    analytics.trackSuccessfulCardLogin({ type: pendingLoginType });
    dispatch(setPendingLoginType(null));
  }, [analytics, dispatch, isSignedIn, pendingLoginType]);

  useEffect(() => {
    if (!isSignedIn || !analytics.configured) {
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

    if (!cardId) return;

    const reportedForCard = cardId === analyticsCardId ? reported : [];
    const milestones = derivePayCardAnalyticsMilestones({
      cardStatus,
      transactions,
      onboardingStatus:
        onboarding.isFetching || onboarding.isError || onboarding.hasSourceError
          ? undefined
          : onboarding.data,
    }).filter(({ id }) => !reportedForCard.includes(id) && !attempted.current.has(id));

    if (!milestones.length) return;
    for (const { id } of milestones) attempted.current.add(id);
    dispatch(markAnalyticsMilestonesReported(milestones.map(({ id }) => id)));
    for (const milestone of milestones) {
      reportMilestone(analytics, milestone);
    }
  }, [
    analytics,
    analyticsCardId,
    cardStatus,
    dispatch,
    isSignedIn,
    onboarding.data,
    onboarding.hasSourceError,
    onboarding.isError,
    onboarding.isFetching,
    reported,
    transactions,
  ]);
}
