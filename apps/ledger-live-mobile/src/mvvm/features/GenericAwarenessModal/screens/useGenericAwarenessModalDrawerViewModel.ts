import { useCallback } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useDispatch, useSelector } from "~/context/hooks";
import {
  closeGenericAwarenessModal,
  genericAwarenessModalSelector,
} from "~/reducers/genericAwarenessModal";
import {
  carouselMockData,
  carouselWithPrimaryLinksMockData,
  carouselWithoutPrimaryLinksMockData,
  featureIntroMockData,
} from "../mockData";

function getMockData(campaignId?: string | null) {
  switch (campaignId) {
    case "carousel-no-links":
      return carouselWithoutPrimaryLinksMockData;
    case "carousel-all-links":
      return carouselWithPrimaryLinksMockData;
    case "carousel-mixed-links":
    case "carousel":
      return carouselMockData;
    case "feature-intro":
    case "featureIntro":
    default:
      return featureIntroMockData;
  }
}

export function useGenericAwarenessModalDrawerViewModel() {
  const dispatch = useDispatch();
  const { bottom: bottomInset } = useSafeAreaInsets();
  const { isOpen, campaignId } = useSelector(genericAwarenessModalSelector);

  const data = getMockData(campaignId);

  const onClose = useCallback(() => {
    dispatch(closeGenericAwarenessModal());
  }, [dispatch]);

  return {
    isOpen,
    data,
    id: campaignId ?? "APP_START",
    bottomInset: bottomInset + 20,
    onClose,
  };
}
