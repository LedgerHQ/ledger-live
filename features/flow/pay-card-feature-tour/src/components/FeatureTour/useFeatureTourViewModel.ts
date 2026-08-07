import { useCallback, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  markPayCardFeatureTourSeen,
  selectPayCardHasSeenFeatureTour,
} from "@domain/entity-pay-card";

export type PayCardTrackScreen = (page: string) => void;

export type PayCardTrackEvent = (event: string, params: Record<string, unknown>) => void;

/** Lumen symbol names used for the feature rows. The host resolves the glyph per platform. */
export type FeatureTourRowIcon = "Globe" | "Chart2" | "CreditCard";

export type FeatureTourRow = Readonly<{
  icon: FeatureTourRowIcon;
  title: string;
  description: string;
}>;

/**
 * User-facing copy injected by the host app. This package stays i18n-agnostic: the app
 * resolves translations (e.g. via `t("payCardFeatureTour.title")`) and passes the strings in.
 */
export type FeatureTourContent = Readonly<{
  title: string;
  description: string;
  ctaLabel: string;
  rows: readonly FeatureTourRow[];
}>;

export type FeatureTourProps = FeatureTourContent &
  Readonly<{
    onTrackScreen?: PayCardTrackScreen;
    onTrackEvent?: PayCardTrackEvent;
  }>;

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
