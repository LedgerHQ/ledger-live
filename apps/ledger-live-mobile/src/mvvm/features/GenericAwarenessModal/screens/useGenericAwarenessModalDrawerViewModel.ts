import { useCallback } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useDispatch, useSelector } from "~/context/hooks";
import {
  closeGenericAwarenessModal,
  genericAwarenessModalSelector,
} from "~/reducers/genericAwarenessModal";
import { carouselMockData, featureIntroMockData } from "../mockData";

export function useGenericAwarenessModalDrawerViewModel() {
  const dispatch = useDispatch();
  const { bottom: bottomInset } = useSafeAreaInsets();
  const { isOpen, campaignId } = useSelector(genericAwarenessModalSelector);

  const data = campaignId === "carousel" ? carouselMockData : featureIntroMockData;

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
