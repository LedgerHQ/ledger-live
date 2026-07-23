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
import { personalizedRecommendationsEnabledSelector } from "~/reducers/settings";
import type { State } from "~/reducers/types";
import { useLargeScreenUpsellEligibility } from "../../hooks/useLargeScreenUpsellEligibility";
import { useCompetingAppStartModalsPresent } from "../../hooks/useCompetingAppStartModalsPresent";
import {
  buildLargeScreenUpsellContent,
  type LargeScreenUpsellVariant,
} from "../../utils/upsellContent";
import {
  toLargeScreenUpsellDeviceModelAnalyticsValue,
  trackLargeScreenUpsellModalCtaClicked,
  trackLargeScreenUpsellModalDismissed,
  trackLargeScreenUpsellModalViewed,
  type LargeScreenUpsellDismissMethod,
  type LargeScreenUpsellSharedAnalyticsProps,
} from "../../analytics";

const LARGE_SCREEN_UPSELL_MODAL_ID = "large-screen-upsell-modal";
const LARGE_SCREEN_UPSELL_MODAL_IOS_BOTTOM_PADDING = 20;

let hasAutoOpenedThisSession = false;

export const __resetLargeScreenUpsellAutoOpenForTests = () => {
  hasAutoOpenedThisSession = false;
};

type LargeScreenUpsellModalPortfolioMountViewModel = Readonly<{
  isEligible: boolean;
  isOpen: boolean;
  onDismiss: (dismissMethod: LargeScreenUpsellDismissMethod) => void;
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
  const personalizedRecommendationsEnabled = useSelector(
    personalizedRecommendationsEnabledSelector,
  );
  const retries = useSelector((state: State) => state.largeScreenUpsellModal.retries);
  const lastSeenAt = useSelector((state: State) => state.largeScreenUpsellModal.lastSeenAt);
  const hasSeenCompetingAppStartModalRef = useRef(hasCompetingAppStartModal);
  const currentModalAnalyticsPropsRef = useRef<LargeScreenUpsellSharedAnalyticsProps | null>(null);
  const hasHandledCurrentModalInteractionRef = useRef(false);
  const [isOpen, setIsOpen] = useState(false);

  if (hasCompetingAppStartModal) {
    hasSeenCompetingAppStartModalRef.current = true;
  }

  const params = feature?.params;
  const hasEnabledFeature = Boolean(feature?.enabled && params);
  const lastSeenAtDate = typeof lastSeenAt === "number" ? new Date(lastSeenAt) : null;

  const isThrottled =
    hasEnabledFeature && params
      ? shouldThrottle(
          retries,
          lastSeenAtDate,
          params.modal.killThreshold,
          params.modal.cadenceDays,
          new Date(),
        )
      : false;
  const hasReachedFrequencyCap =
    hasEnabledFeature && params ? retries >= params.modal.killThreshold : false;

  const isEligible = Boolean(
    hasEnabledFeature && params && eligibility.isEligible && params.modal.enabled && !isThrottled,
  );
  const shouldAttemptAutoOpen =
    isEligible && !hasSeenCompetingAppStartModalRef.current && !hasAutoOpenedThisSession;

  const variant: LargeScreenUpsellVariant = personalizedRecommendationsEnabled
    ? "opted_in"
    : "opted_out";

  const sharedAnalyticsProps: LargeScreenUpsellSharedAnalyticsProps | null = useMemo(() => {
    if (!("deviceModelId" in eligibility)) {
      return null;
    }

    return {
      deviceModel: toLargeScreenUpsellDeviceModelAnalyticsValue(eligibility.deviceModelId),
      personalRecoOptIn: personalizedRecommendationsEnabled,
      offerType: variant === "opted_in" ? "discount" : "none",
      platform: "lwm",
      retriesUpsellModal: retries,
      throttled: hasReachedFrequencyCap,
    };
  }, [eligibility, personalizedRecommendationsEnabled, variant, retries, hasReachedFrequencyCap]);

  const getCurrentModalAnalyticsProps = useCallback(
    () => currentModalAnalyticsPropsRef.current ?? sharedAnalyticsProps,
    [sharedAnalyticsProps],
  );

  const onDismiss = useCallback(
    (dismissMethod: LargeScreenUpsellDismissMethod) => {
      if (hasHandledCurrentModalInteractionRef.current) {
        setIsOpen(false);
        return;
      }

      hasHandledCurrentModalInteractionRef.current = true;
      const analyticsProps = getCurrentModalAnalyticsProps();
      if (analyticsProps) {
        trackLargeScreenUpsellModalDismissed(dismissMethod, analyticsProps);
      }
      currentModalAnalyticsPropsRef.current = null;
      setIsOpen(false);
    },
    [getCurrentModalAnalyticsProps],
  );

  const onCloseFromCta = useCallback(() => {
    if (hasHandledCurrentModalInteractionRef.current) {
      setIsOpen(false);
      return;
    }

    hasHandledCurrentModalInteractionRef.current = true;
    const analyticsProps = getCurrentModalAnalyticsProps();
    if (analyticsProps) {
      trackLargeScreenUpsellModalCtaClicked(analyticsProps);
    }
    currentModalAnalyticsPropsRef.current = null;
    dispatch(resetUpsellModalRetries());
    setIsOpen(false);
  }, [dispatch, getCurrentModalAnalyticsProps]);

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
        hasHandledCurrentModalInteractionRef.current = false;
        currentModalAnalyticsPropsRef.current = sharedAnalyticsProps;
        if (currentModalAnalyticsPropsRef.current) {
          trackLargeScreenUpsellModalViewed(currentModalAnalyticsPropsRef.current);
        }
        dispatch(recordUpsellModalDisplay());
        setIsOpen(true);
      });

      return () => {
        cancelAnimationFrame(frame);
      };
    }, [dispatch, shouldAttemptAutoOpen, sharedAnalyticsProps]),
  );

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
    onDismiss,
    featureIntroViewModel: {
      content,
      onPrimaryPress: onCloseFromCta,
      onSecondaryPress: () => onDismiss("outside tap"),
    },
    bottomInset: bottom + LARGE_SCREEN_UPSELL_MODAL_IOS_BOTTOM_PADDING,
  };
}
