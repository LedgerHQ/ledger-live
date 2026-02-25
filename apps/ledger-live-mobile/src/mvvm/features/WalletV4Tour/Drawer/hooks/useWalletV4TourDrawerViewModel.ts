import { useState, useCallback, useMemo } from "react";
import { useDispatch, useSelector } from "~/context/hooks";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import { setHasSeenWalletV4Tour } from "~/actions/settings";
import { hasCompletedOnboardingSelector, hasSeenWalletV4TourSelector } from "~/reducers/settings";
import type { WalletV4TourDrawerViewModel } from "../types";
import { useTranslation } from "~/context/Locale";
import animation01 from "../animations/01.lottie";
import animation02 from "../animations/02.lottie";
import animation03 from "../animations/03.lottie";

export const useWalletV4TourDrawerViewModel = (): WalletV4TourDrawerViewModel => {
  const dispatch = useDispatch();
  const hasSeenTour = useSelector(hasSeenWalletV4TourSelector);
  const hasCompletedOnboarding = useSelector(hasCompletedOnboardingSelector);
  const lwmWallet40 = useFeature("lwmWallet40");
  const isTourEnabled = (lwmWallet40?.enabled && lwmWallet40?.params?.tour) ?? false;

  const [isDrawerOpen, setIsDrawerOpen] = useState(isTourEnabled && !hasSeenTour);

  const handleOpenDrawer = useCallback(() => {
    if (!hasCompletedOnboarding) {
      dispatch(setHasSeenWalletV4Tour(true));
    } else if (!hasSeenTour) setIsDrawerOpen(true);
    return;
  }, [hasCompletedOnboarding, hasSeenTour, dispatch]);

  const handleCloseDrawer = useCallback(() => {
    setIsDrawerOpen(false);
    if (!hasSeenTour) {
      dispatch(setHasSeenWalletV4Tour(true));
    }
  }, [dispatch, hasSeenTour]);

  const { t } = useTranslation();
  const slides = useMemo(
    () => [
      {
        title: t("walletV4Tour.slides.portfolio.title"),
        description: t("walletV4Tour.slides.portfolio.description"),
        lottieSrc: animation01,
        speed: 1.25,
      },
      {
        title: t("walletV4Tour.slides.navigation.title"),
        description: t("walletV4Tour.slides.navigation.description"),
        lottieSrc: animation02,
        speed: 1.5,
      },
      {
        title: t("walletV4Tour.slides.actions.title"),
        description: t("walletV4Tour.slides.actions.description"),
        lottieSrc: animation03,
        speed: 1.01,
      },
    ],
    [t],
  );

  return {
    isDrawerOpen,
    handleOpenDrawer,
    handleCloseDrawer,
    slides,
  };
};
