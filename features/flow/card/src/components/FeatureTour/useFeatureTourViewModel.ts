import { useCallback, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  markPayCardFeatureTourSeen,
  selectPayCardHasSeenFeatureTour,
} from "@domain/entity-pay-card";

export type PayCardTrackScreen = (page: string) => void;

export type PayCardTrackEvent = (event: string, params: Record<string, unknown>) => void;

export type FeatureTourProps = {
  readonly onTrackScreen?: PayCardTrackScreen;
  readonly onTrackEvent?: PayCardTrackEvent;
};

export type FeatureTourRow = {
  readonly key: string;
  readonly title: string;
  readonly description: string;
};

export type FeatureTourViewModel = {
  readonly isVisible: boolean;
  readonly title: string;
  readonly description: string;
  readonly rows: readonly FeatureTourRow[];
  readonly ctaLabel: string;
  readonly onShown: () => void;
  readonly onDismiss: () => void;
};

const TRACK_PAGE = "Page card feature intro";

const ROWS: readonly FeatureTourRow[] = [
  {
    key: "global",
    title: "Pay and get paid globally",
    description: "Benefits from low networks fees",
  },
  {
    key: "volatility",
    title: "Minimal volatility",
    description: "Stablecoin are based on fiat",
  },
  {
    key: "card",
    title: "Spend with a card and get 1% cashback",
    description: "Pay in USDC, USDT, BTC, ETH and more",
  },
];

export function useFeatureTourViewModel({
  onTrackScreen,
  onTrackEvent,
}: FeatureTourProps = {}): FeatureTourViewModel {
  const dispatch = useDispatch();
  const hasSeenFeatureTour = useSelector(selectPayCardHasSeenFeatureTour);

  const onShown = useCallback(() => {
    onTrackScreen?.(TRACK_PAGE);
  }, [onTrackScreen]);

  const onDismiss = useCallback(() => {
    dispatch(markPayCardFeatureTourSeen());
    onTrackEvent?.("button_clicked", { button: "got it", page: "$page" });
  }, [dispatch, onTrackEvent]);

  return useMemo(
    () => ({
      isVisible: !hasSeenFeatureTour,
      title: "Pay and get paid",
      description: "Stablecoin closes the gap between crypto and real life spending",
      rows: ROWS,
      ctaLabel: "Got it",
      onShown,
      onDismiss,
    }),
    [hasSeenFeatureTour, onShown, onDismiss],
  );
}
