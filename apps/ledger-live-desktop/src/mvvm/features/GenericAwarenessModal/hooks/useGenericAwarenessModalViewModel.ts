import { useCallback, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "LLD/hooks/redux";
import type { GenericAwarenessModalContentCard } from "@ledgerhq/live-common/genericAwarenessModal";
import type { State } from "~/renderer/reducers";
import { openDialog } from "~/renderer/reducers/dialogs";
import {
  selectGenericAwarenessModalCampaignId,
  selectGenericAwarenessModalContentCardByCampaignId,
} from "~/renderer/reducers/genericAwarenessModalSlice";
import {
  closeGenericAwarenessModalDialog,
  selectIsGenericAwarenessModalOpen,
} from "../genericAwarenessModalDialog";

const GENERIC_AWARENESS_MODAL_DIALOG_ID = "GENERIC_AWARENESS_MODAL" as const;

export interface GenericAwarenessModalViewProps {
  isOpen: boolean;
  onClose: () => void;
  contentCard: GenericAwarenessModalContentCard | undefined;
}

const useGenericAwarenessModalViewModel = (): GenericAwarenessModalViewProps => {
  const dispatch = useDispatch();
  const isOpen = useSelector(selectIsGenericAwarenessModalOpen);
  const campaignId = useSelector(selectGenericAwarenessModalCampaignId);
  const contentCard = useSelector((state: State) =>
    selectGenericAwarenessModalContentCardByCampaignId(state)(campaignId),
  );
  const lockedContentCardRef = useRef<GenericAwarenessModalContentCard | undefined>(undefined);

  useEffect(() => {
    if (isOpen && contentCard) {
      lockedContentCardRef.current = contentCard;
    }
  }, [isOpen, campaignId, contentCard]);

  // Deeplink may set campaignId before Braze content cards are in the store.
  useEffect(() => {
    if (isOpen || campaignId === undefined || !contentCard) {
      return;
    }
    dispatch(openDialog(GENERIC_AWARENESS_MODAL_DIALOG_ID));
  }, [campaignId, contentCard, dispatch, isOpen]);

  const onClose = useCallback(() => {
    dispatch(closeGenericAwarenessModalDialog());
  }, [dispatch]);

  const displayedContentCard = isOpen
    ? contentCard ?? lockedContentCardRef.current
    : lockedContentCardRef.current;

  return {
    isOpen,
    onClose,
    contentCard: displayedContentCard,
  };
};

export default useGenericAwarenessModalViewModel;
