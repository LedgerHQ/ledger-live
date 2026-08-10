import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Linking } from "react-native";
import { buildLazyOnboardingBannerLink } from "@features/flow-lazy-onboarding-banner";
import { useFeature } from "@features/platform-feature-flags";
import { useSelector } from "~/context/hooks";
import { personalizedRecommendationsEnabledSelector } from "~/reducers/settings";
import {
  trackLazyOnboardingTourBuyClicked,
  trackLazyOnboardingTourCloseClicked,
  trackLazyOnboardingTourContinueClicked,
  trackLazyOnboardingTourDoneClicked,
  trackLazyOnboardingTourOpened,
  trackLazyOnboardingTourShopReached,
  trackLazyOnboardingTourStepViewed,
  type LazyOnboardingTourSharedAnalyticsProps,
} from "./analytics";
import { lazyOnboardingTourController } from "./lazyOnboardingTourController";

export type LazyOnboardingTourDrawerViewModel = Readonly<{
  isOpen: boolean;
  shopLink: string;
  sharedAnalyticsProps: LazyOnboardingTourSharedAnalyticsProps;
  onClose: () => void;
  onCloseButtonPress: () => void;
  onSlideChange: (index: number) => void;
  onContinue: (step: number) => void;
  onBuy: (step: number) => void;
  onDone: () => void;
}>;

export function useLazyOnboardingTourDrawerViewModel(): LazyOnboardingTourDrawerViewModel | null {
  const feature = useFeature("lazyOnboardingBanner");
  const personalizedRecommendationsEnabled = useSelector(
    personalizedRecommendationsEnabledSelector,
  );
  const [isOpen, setIsOpen] = useState(false);
  const hasClosedRef = useRef(false);
  const hasTrackedTourOpenRef = useRef(false);
  const lastTrackedStepIndexRef = useRef<number | null>(null);

  const isFeatureEnabled = feature?.enabled === true;
  const link = typeof feature?.params?.link === "string" ? feature.params.link : "";
  const shopLink = buildLazyOnboardingBannerLink(link, "mobile");

  const sharedAnalyticsProps = useMemo(
    (): LazyOnboardingTourSharedAnalyticsProps => ({
      hasConnectedDevice: false,
      personalRecoOptIn: personalizedRecommendationsEnabled,
      offerType: "none",
      platform: "llm",
      source: "lazy onboarding",
      mode: "feature_intro",
    }),
    [personalizedRecommendationsEnabled],
  );

  const closeDrawer = useCallback(() => {
    if (hasClosedRef.current) {
      return;
    }
    hasClosedRef.current = true;
    setIsOpen(false);
  }, []);

  const openDrawer = useCallback(() => {
    hasClosedRef.current = false;
    setIsOpen(true);
  }, []);

  useLayoutEffect(() => {
    return lazyOnboardingTourController.registerOpen(openDrawer);
  }, [openDrawer]);

  useEffect(() => {
    if (!isOpen) {
      hasClosedRef.current = false;
      hasTrackedTourOpenRef.current = false;
      lastTrackedStepIndexRef.current = null;
      return;
    }

    const hasTrackedOpen = trackLazyOnboardingTourOpened(
      sharedAnalyticsProps,
      hasTrackedTourOpenRef.current,
    );
    if (!hasTrackedOpen) {
      return;
    }

    hasTrackedTourOpenRef.current = true;
    lastTrackedStepIndexRef.current = 0;
  }, [isOpen, sharedAnalyticsProps]);

  useEffect(() => {
    if (isOpen && !isFeatureEnabled) {
      closeDrawer();
    }
  }, [closeDrawer, isFeatureEnabled, isOpen]);

  const onClose = useCallback(() => {
    closeDrawer();
  }, [closeDrawer]);

  const onCloseButtonPress = useCallback(() => {
    trackLazyOnboardingTourCloseClicked(sharedAnalyticsProps);
    closeDrawer();
  }, [closeDrawer, sharedAnalyticsProps]);

  const onSlideChange = useCallback(
    (index: number) => {
      lastTrackedStepIndexRef.current = trackLazyOnboardingTourStepViewed(
        index,
        sharedAnalyticsProps,
        lastTrackedStepIndexRef.current,
      );
    },
    [sharedAnalyticsProps],
  );

  const onContinue = useCallback(
    (step: number) => {
      trackLazyOnboardingTourContinueClicked(step, sharedAnalyticsProps);
    },
    [sharedAnalyticsProps],
  );

  const onBuy = useCallback(
    (step: number) => {
      trackLazyOnboardingTourBuyClicked(step, sharedAnalyticsProps);
      void Linking.openURL(shopLink);
      trackLazyOnboardingTourShopReached(sharedAnalyticsProps);
    },
    [sharedAnalyticsProps, shopLink],
  );

  const onDone = useCallback(() => {
    trackLazyOnboardingTourDoneClicked(sharedAnalyticsProps);
    closeDrawer();
  }, [closeDrawer, sharedAnalyticsProps]);

  if (!isFeatureEnabled) {
    return null;
  }

  return {
    isOpen,
    shopLink,
    sharedAnalyticsProps,
    onClose,
    onCloseButtonPress,
    onSlideChange,
    onContinue,
    onBuy,
    onDone,
  };
}
