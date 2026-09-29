import { useCallback, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "@shared/i18n";
import { featureIntroPageName, trackButtonClicked } from "@features/platform-pay-analytics";
import { markPayCardFeatureTourSeen, selectPayCardHasSeenFeatureTour } from "../../state";
import type { FeatureTourRow, FeatureTourRowIcon } from "./types";

export type FeatureTourViewModel = Readonly<{
  isVisible: boolean;
  title: string;
  description: string;
  rows: readonly FeatureTourRow[];
  ctaLabel: string;
  onClose: () => void;
  onContinue: () => void;
}>;

export const FEATURE_TOUR_FLOW = "pay";
export const FEATURE_TOUR_PAGE = featureIntroPageName(FEATURE_TOUR_FLOW);

const KEY_PREFIX = "payTab.featureTour";

const ROWS: readonly { icon: FeatureTourRowIcon; key: string }[] = [
  { icon: "Contact", key: "global" },
  { icon: "Link", key: "volatility" },
  { icon: "CreditCard", key: "card" },
];

export function useFeatureTourViewModel(): FeatureTourViewModel {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const hasSeenFeatureTour = useSelector(selectPayCardHasSeenFeatureTour);

  const dismiss = useCallback(
    (button: "close" | "continue") => {
      dispatch(markPayCardFeatureTourSeen());
      trackButtonClicked({
        button,
        flow: FEATURE_TOUR_FLOW,
        page: FEATURE_TOUR_PAGE,
      });
    },
    [dispatch],
  );
  const onClose = useCallback(() => dismiss("close"), [dismiss]);
  const onContinue = useCallback(() => dismiss("continue"), [dismiss]);

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
      onClose,
      onContinue,
    }),
    [hasSeenFeatureTour, onClose, onContinue, rows, t],
  );
}
