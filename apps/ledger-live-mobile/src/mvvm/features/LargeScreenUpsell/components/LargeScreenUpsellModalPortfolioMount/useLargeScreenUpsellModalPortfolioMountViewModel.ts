import { useCallback, useMemo, useRef, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFeature } from "@features/platform-feature-flags";
import { shouldThrottle } from "@ledgerhq/live-common/postOnboarding/logic/upsellFrequency";
import {
  recordUpsellModalDisplay,
  resetUpsellModalRetries,
} from "@ledgerhq/live-engagement/largeScreenUpsellModal";
import type { FeatureIntroViewModel } from "LLM/components/FeatureIntroLayout/types";
import { useTranslation } from "~/context/Locale";
import { useDispatch, useSelector } from "~/context/hooks";
import { analyticsEnabledSelector } from "~/reducers/settings";
import type { State } from "~/reducers/types";
import { useLargeScreenUpsellEligibility } from "../../hooks/useLargeScreenUpsellEligibility";
import { useCompetingAppStartModalsPresent } from "../../hooks/useCompetingAppStartModalsPresent";
import {
  buildLargeScreenUpsellContent,
  type LargeScreenUpsellVariant,
} from "../../utils/upsellContent";

const LARGE_SCREEN_UPSELL_MODAL_ID = "large-screen-upsell-modal";
const LARGE_SCREEN_UPSELL_MODAL_IOS_BOTTOM_PADDING = 20;

let hasAutoOpenedThisSession = false;

export const __resetLargeScreenUpsellAutoOpenForTests = () => {
  hasAutoOpenedThisSession = false;
};

type LargeScreenUpsellModalPortfolioMountViewModel = Readonly<{
  isEligible: boolean;
  isOpen: boolean;
  onClose: () => void;
  featureIntroViewModel: FeatureIntroViewModel;
  bottomInset: number;
}>;

export function useLargeScreenUpsellModalPortfolioMountViewModel(): LargeScreenUpsellModalPortfolioMountViewModel | null {
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const { bottom } = useSafeAreaInsets();
  const feature = useFeature("largeScreenUpsell");
  const eligibility = useLargeScreenUpsellEligibility();
  const hasCompetingAppStartModal = useCompetingAppStartModalsPresent();
  const analyticsEnabled = useSelector(analyticsEnabledSelector);
  const retries = useSelector((state: State) => state.largeScreenUpsellModal.retries);
  const lastSeenAt = useSelector((state: State) => state.largeScreenUpsellModal.lastSeenAt);
  const hasSeenCompetingAppStartModalRef = useRef(hasCompetingAppStartModal);
  const [isOpen, setIsOpen] = useState(false);

  if (hasCompetingAppStartModal) {
    hasSeenCompetingAppStartModalRef.current = true;
  }

  const params = feature?.params;
  const hasEnabledFeature = Boolean(feature?.enabled && params);

  const isThrottled =
    hasEnabledFeature && params
      ? shouldThrottle(
          retries,
          typeof lastSeenAt === "number" ? new Date(lastSeenAt) : null,
          params.modal.killThreshold,
          params.modal.cadenceDays,
          new Date(),
        )
      : false;

  const isEligible = Boolean(
    hasEnabledFeature && params && eligibility.isEligible && params.modal.enabled && !isThrottled,
  );
  const shouldAttemptAutoOpen =
    isEligible && !hasSeenCompetingAppStartModalRef.current && !hasAutoOpenedThisSession;

  const onClose = useCallback(() => {
    setIsOpen(false);
  }, []);

  const onCloseFromCta = useCallback(() => {
    dispatch(resetUpsellModalRetries());
    setIsOpen(false);
  }, [dispatch]);

  useFocusEffect(
    useCallback(() => {
      if (!shouldAttemptAutoOpen) {
        return;
      }

      const frame = requestAnimationFrame(() => {
        if (hasAutoOpenedThisSession || hasSeenCompetingAppStartModalRef.current) {
          return;
        }

        hasAutoOpenedThisSession = true;
        dispatch(recordUpsellModalDisplay());
        setIsOpen(true);
      });

      return () => {
        cancelAnimationFrame(frame);
      };
    }, [dispatch, shouldAttemptAutoOpen]),
  );

  const variant: LargeScreenUpsellVariant = analyticsEnabled ? "opted_in" : "opted_out";
  const content = useMemo(
    () =>
      hasEnabledFeature && params
        ? buildLargeScreenUpsellContent({
            id: LARGE_SCREEN_UPSELL_MODAL_ID,
            variant,
            discount: params.discount,
            optedInLink: params.opted_in.link,
            optedOutLink: params.opted_out.link,
            t,
          })
        : null,
    [hasEnabledFeature, params, t, variant],
  );

  if (!hasEnabledFeature || !content) {
    return null;
  }

  return {
    isEligible,
    isOpen,
    onClose,
    featureIntroViewModel: {
      content,
      onPrimaryPress: onCloseFromCta,
      onSecondaryPress: onClose,
    },
    bottomInset: bottom + LARGE_SCREEN_UPSELL_MODAL_IOS_BOTTOM_PADDING,
  };
}
