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
import { useLargeScreenUpsellEligibility } from "LLM/features/LargeScreenUpsell";
import { useTranslation } from "~/context/Locale";
import { useDispatch, useSelector } from "~/context/hooks";
import { analyticsEnabledSelector } from "~/reducers/settings";
import type { State } from "~/reducers/types";
import { useCompetingAppStartModalsPresent } from "../../hooks/useCompetingAppStartModalsPresent";
import {
  buildLargeScreenUpsellContent,
  type LargeScreenUpsellVariant,
} from "../../utils/upsellContent";

const LARGE_SCREEN_UPSELL_MODAL_ID = "large-screen-upsell-modal";
const LARGE_SCREEN_UPSELL_MODAL_IOS_BOTTOM_PADDING = 20;
const FORCE_LARGE_SCREEN_UPSELL_IN_DEV = __DEV__ && process.env.NODE_ENV !== "test";

let hasAutoOpenedThisSession = false;

export const __resetLargeScreenUpsellAutoOpenForTests = () => {
  hasAutoOpenedThisSession = false;
};

type LargeScreenUpsellModalPortfolioMountViewModel = Readonly<{
  isEligible: boolean;
  isOpen: boolean;
  onClose: () => void;
  onCloseFromCta: () => void;
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
  const competingAtMountRef = useRef(hasCompetingAppStartModal);
  const [isOpen, setIsOpen] = useState(FORCE_LARGE_SCREEN_UPSELL_IN_DEV);

  const params = feature?.params;
  const hasEnabledFeature = Boolean(
    (feature?.enabled || FORCE_LARGE_SCREEN_UPSELL_IN_DEV) && params,
  );

  const isThrottled =
    !FORCE_LARGE_SCREEN_UPSELL_IN_DEV && hasEnabledFeature && params
      ? shouldThrottle(
          retries,
          typeof lastSeenAt === "number" ? new Date(lastSeenAt) : null,
          params.modal.killThreshold,
          params.modal.cadenceDays,
          new Date(),
        )
      : false;

  const isEligible = Boolean(
    hasEnabledFeature &&
    params &&
    (eligibility.isEligible || FORCE_LARGE_SCREEN_UPSELL_IN_DEV) &&
    (params.modal.enabled || FORCE_LARGE_SCREEN_UPSELL_IN_DEV) &&
    !isThrottled,
  );
  const shouldAttemptAutoOpen =
    isEligible &&
    (!competingAtMountRef.current || FORCE_LARGE_SCREEN_UPSELL_IN_DEV) &&
    (!hasAutoOpenedThisSession || FORCE_LARGE_SCREEN_UPSELL_IN_DEV);

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

      hasAutoOpenedThisSession = true;
      dispatch(recordUpsellModalDisplay());
      setIsOpen(true);
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
    onCloseFromCta,
    featureIntroViewModel: {
      content,
      onPrimaryPress: onCloseFromCta,
      onSecondaryPress: onClose,
    },
    bottomInset: bottom + LARGE_SCREEN_UPSELL_MODAL_IOS_BOTTOM_PADDING,
  };
}
