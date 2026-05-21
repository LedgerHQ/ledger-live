import { useCallback, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "LLD/hooks/redux";
import type { GenericAwarenessModalContentCard } from "@ledgerhq/live-common/genericAwarenessModal";
import type { State } from "~/renderer/reducers";
import { selectGenericAwarenessModalContentCardByCampaignId } from "~/renderer/reducers/genericAwarenessModalSlice";
import {
  closeGenericAwarenessModalDialog,
  selectGenericAwarenessModalCampaignId,
  selectIsGenericAwarenessModalOpen,
} from "../genericAwarenessModalDialog";

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
    if (isOpen) {
      lockedContentCardRef.current = contentCard;
    }
  }, [isOpen, campaignId, contentCard]);

  const onClose = useCallback(() => {
    dispatch(closeGenericAwarenessModalDialog());
  }, [dispatch]);

  const displayedContentCard = isOpen ? contentCard : lockedContentCardRef.current;

  return {
    isOpen,
    onClose,
    contentCard: displayedContentCard,
  };
};

export default useGenericAwarenessModalViewModel;
