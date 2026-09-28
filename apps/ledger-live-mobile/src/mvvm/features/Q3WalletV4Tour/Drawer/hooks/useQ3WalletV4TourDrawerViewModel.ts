import { useCallback, useMemo } from "react";
import { useFeature } from "@features/platform-feature-flags";
import {
  useWalletV4TourDrawerViewModel,
  type WalletV4TourDrawerViewModel,
} from "LLM/components/WalletV4TourDrawer";
import { useDispatch, useSelector } from "~/context/hooks";
import { setHasSeenQ3WalletV4Tour } from "~/actions/settings";
import { hasSeenQ3WalletV4TourSelector } from "~/reducers/settings";
import { isQ3ReleaseTourEnabled } from "LLM/utils/releaseTourGate";
import { getQ3TourStepName } from "../../analytics/const";
import { createQ3WalletV4TourAnalytics } from "../../analytics/q3TourCarouselAnalytics";
import { getQ3WalletV4Tour, resolveQ3WalletV4TourVariant } from "../const";

export const useQ3WalletV4TourDrawerViewModel = (): WalletV4TourDrawerViewModel => {
  const dispatch = useDispatch();
  const hasSeenTour = useSelector(hasSeenQ3WalletV4TourSelector);
  const releaseTour = useFeature("releaseTour");
  const isTourEnabled = isQ3ReleaseTourEnabled(releaseTour);
  const variant = resolveQ3WalletV4TourVariant(releaseTour?.params?.variant);
  const tour = getQ3WalletV4Tour(releaseTour?.params?.variant);
  const analytics = useMemo(
    () => createQ3WalletV4TourAnalytics(tour.slides.length, variant),
    [tour.slides.length, variant],
  );

  const markTourAsSeen = useCallback(() => {
    dispatch(setHasSeenQ3WalletV4Tour(true));
  }, [dispatch]);

  const getStepName = useCallback(
    (slideIndex: number) => getQ3TourStepName(tour.slides[slideIndex]?.titleKey ?? ""),
    [tour.slides],
  );

  return useWalletV4TourDrawerViewModel({
    isTourEnabled,
    hasSeenTour,
    markTourAsSeen,
    page: tour.page,
    variant,
    analytics,
    getStepName,
  });
};
