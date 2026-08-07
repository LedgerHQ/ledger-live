import { useCallback, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  markPayCardFeatureTourSeen,
  selectPayCardHasSeenFeatureTour,
} from "@domain/entity-pay-card";
import type { FeatureTourProps, FeatureTourRow } from "./types";

export type FeatureTourViewModel = Readonly<{
  isVisible: boolean;
  title: string;
  description: string;
  rows: readonly FeatureTourRow[];
  ctaLabel: string;
  onShown: () => void;
  onDismiss: () => void;
}>;

const TRACK_PAGE = "Page card feature intro";

export function useFeatureTourViewModel({
  title,
  description,
  ctaLabel,
  rows,
  onTrackScreen,
  onTrackEvent,
}: FeatureTourProps): FeatureTourViewModel {
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
      title,
      description,
      rows,
      ctaLabel,
      onShown,
      onDismiss,
    }),
    [hasSeenFeatureTour, title, description, rows, ctaLabel, onShown, onDismiss],
  );
}
