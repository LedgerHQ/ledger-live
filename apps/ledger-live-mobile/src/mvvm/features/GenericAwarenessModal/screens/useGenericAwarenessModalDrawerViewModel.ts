import { useCallback } from "react";
import { useIsFocused } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import { useDispatch, useSelector } from "~/context/hooks";
import { setDismissedContentCard } from "~/actions/settings";
import {
  closeGenericAwarenessModalDrawer,
  markGenericAwarenessModalContentCardAsRead,
  openGenericAwarenessModalDrawer,
  selectGenericAwarenessModalCampaignId,
  selectGenericAwarenessModalContentCards,
  selectCurrentGenericAwarenessModalContentCard,
  selectIsGenericAwarenessModalOpen,
} from "~/reducers/genericAwarenessModal";
import { useGenericAwarenessModalLogic } from "./useGenericAwarenessModalLogic";

export function useGenericAwarenessModalDrawerViewModel() {
  const dispatch = useDispatch();
  const isPortfolioFocused = useIsFocused();
  const { bottom: bottomInset } = useSafeAreaInsets();
  const genericAwarenessModalFlag = useFeature("lwmGenericAwarenessModal");
  const isOpen = useSelector(selectIsGenericAwarenessModalOpen);
  const campaignId = useSelector(selectGenericAwarenessModalCampaignId);
  const cards = useSelector(selectGenericAwarenessModalContentCards);
  const data = useSelector(selectCurrentGenericAwarenessModalContentCard);

  const open = useCallback(
    (campaignId: string) => {
      dispatch(openGenericAwarenessModalDrawer({ campaignId }));
    },
    [dispatch],
  );

  const { shouldMarkAsRead } = useGenericAwarenessModalLogic(
    { campaignId, cards },
    {
      enabled: genericAwarenessModalFlag?.enabled ?? false,
      isFocused: isPortfolioFocused,
      isOpen,
      open,
    },
  );

  const onClose = useCallback(() => {
    if (data && shouldMarkAsRead) {
      dispatch(setDismissedContentCard({ [data.id]: Date.now() }));
      dispatch(markGenericAwarenessModalContentCardAsRead({ id: data.id }));
    }

    dispatch(closeGenericAwarenessModalDrawer());
  }, [data, dispatch, shouldMarkAsRead]);

  return {
    isOpen,
    data,
    bottomInset: bottomInset + 20,
    onClose,
  };
}
