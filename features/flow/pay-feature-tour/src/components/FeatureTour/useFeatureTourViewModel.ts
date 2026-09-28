import { useCallback, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "@shared/i18n";
import { usePayAnalyticsContext } from "@features/platform-pay-analytics";
import { markPayCardFeatureTourSeen, selectPayCardHasSeenFeatureTour } from "../../state";
import type { FeatureTourRow, FeatureTourRowIcon } from "./types";

export type FeatureTourViewModel = Readonly<{
  isVisible: boolean;
  title: string;
  description: string;
  rows: readonly FeatureTourRow[];
  ctaLabel: string;
  onDismiss: () => void;
}>;

export const FEATURE_TOUR_PAGE = "card feature intro";
const TRACK_FLOW = "card";

const KEY_PREFIX = "payTab.featureTour";

const ROWS: readonly { icon: FeatureTourRowIcon; key: string }[] = [
  { icon: "Contact", key: "global" },
  { icon: "Link", key: "volatility" },
  { icon: "CreditCard", key: "card" },
];

export function useFeatureTourViewModel(): FeatureTourViewModel {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { trackButtonClicked } = usePayAnalyticsContext();
  const hasSeenFeatureTour = useSelector(selectPayCardHasSeenFeatureTour);

  const onDismiss = useCallback(() => {
    dispatch(markPayCardFeatureTourSeen());
    trackButtonClicked({
      button: "got it",
      flow: TRACK_FLOW,
      page: FEATURE_TOUR_PAGE,
    });
  }, [dispatch, trackButtonClicked]);

  const rows = useMemo(
    () =>
      ROWS.map(({ icon, key }) => ({
        icon,
        title: t(`${KEY_PREFIX}.rows.${key}.title`),
        description: t(`${KEY_PREFIX}.rows.${key}.description`),
      })),
    [t],
  );

  return useMemo(
    () => ({
      isVisible: !hasSeenFeatureTour,
      title: t(`${KEY_PREFIX}.title`),
      description: t(`${KEY_PREFIX}.description`),
      rows,
      ctaLabel: t(`${KEY_PREFIX}.cta`),
      onDismiss,
    }),
    [hasSeenFeatureTour, t, rows, onDismiss],
  );
}
