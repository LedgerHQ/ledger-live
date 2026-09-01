import { useCallback, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "@shared/i18n";
import { markPayCardFeatureTourSeen, selectPayCardHasSeenFeatureTour } from "../../state";
import type { FeatureTourProps, FeatureTourRow, FeatureTourRowIcon } from "./types";

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

const KEY_PREFIX = "payTab.featureTour";

/** Icon per row, paired with the translation sub-key that carries its copy. */
const ROWS: readonly { icon: FeatureTourRowIcon; key: string }[] = [
  { icon: "Contact", key: "global" },
  { icon: "Link", key: "volatility" },
  { icon: "CreditCard", key: "card" },
];

export function useFeatureTourViewModel({
  onTrackScreen,
  onTrackEvent,
}: FeatureTourProps): FeatureTourViewModel {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const hasSeenFeatureTour = useSelector(selectPayCardHasSeenFeatureTour);

  const onShown = useCallback(() => {
    onTrackScreen?.(TRACK_PAGE);
  }, [onTrackScreen]);

  const onDismiss = useCallback(() => {
    dispatch(markPayCardFeatureTourSeen());
    onTrackEvent?.("button_clicked", { button: "got it", page: "$page" });
  }, [dispatch, onTrackEvent]);

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
      onShown,
      onDismiss,
    }),
    [hasSeenFeatureTour, t, rows, onShown, onDismiss],
  );
}
