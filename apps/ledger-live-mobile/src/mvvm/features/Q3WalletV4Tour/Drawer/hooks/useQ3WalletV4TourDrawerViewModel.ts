import { useCallback } from "react";
import { useFeature } from "@features/platform-feature-flags";
import {
  useWalletV4TourDrawerViewModel,
  type WalletV4TourDrawerViewModel,
} from "LLM/components/WalletV4TourDrawer";
import { useDispatch, useSelector } from "~/context/hooks";
import { setHasSeenQ3WalletV4Tour } from "~/actions/settings";
import { hasSeenQ3WalletV4TourSelector } from "~/reducers/settings";
import { PAGE_TRACKING_Q3_WALLET_V4_TOUR } from "../const";

export const useQ3WalletV4TourDrawerViewModel = (): WalletV4TourDrawerViewModel => {
  const dispatch = useDispatch();
  const hasSeenTour = useSelector(hasSeenQ3WalletV4TourSelector);
  const releaseTour = useFeature("releaseTour");
  const isTourEnabled = releaseTour?.enabled === true && releaseTour.params?.variant === "q3_a";

  const markTourAsSeen = useCallback(() => {
    dispatch(setHasSeenQ3WalletV4Tour(true));
  }, [dispatch]);

  return useWalletV4TourDrawerViewModel({
    isTourEnabled,
    hasSeenTour,
    markTourAsSeen,
    page: PAGE_TRACKING_Q3_WALLET_V4_TOUR,
  });
};
