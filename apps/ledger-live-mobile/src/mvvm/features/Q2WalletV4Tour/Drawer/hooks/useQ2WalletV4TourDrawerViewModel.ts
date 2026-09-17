import { useCallback } from "react";
import { useFeature } from "@features/platform-feature-flags";
import {
  useWalletV4TourDrawerViewModel,
  type WalletV4TourDrawerViewModel,
} from "LLM/components/WalletV4TourDrawer";
import { useDispatch, useSelector } from "~/context/hooks";
import { setHasSeenQ2WalletV4Tour } from "~/actions/settings";
import { hasSeenQ2WalletV4TourSelector } from "~/reducers/settings";
import { isQ2ReleaseTourEnabled } from "LLM/utils/releaseTourGate";
import { PAGE_TRACKING_Q2_WALLET_V4_TOUR } from "../const";

export const useQ2WalletV4TourDrawerViewModel = (): WalletV4TourDrawerViewModel => {
  const dispatch = useDispatch();
  const hasSeenTour = useSelector(hasSeenQ2WalletV4TourSelector);
  const isTourEnabled = isQ2ReleaseTourEnabled(useFeature("releaseTour"));

  const markTourAsSeen = useCallback(() => {
    dispatch(setHasSeenQ2WalletV4Tour(true));
  }, [dispatch]);

  return useWalletV4TourDrawerViewModel({
    isTourEnabled,
    hasSeenTour,
    markTourAsSeen,
    page: PAGE_TRACKING_Q2_WALLET_V4_TOUR,
  });
};
