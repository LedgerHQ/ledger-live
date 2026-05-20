import { useCallback, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "LLD/hooks/redux";
import {
  closeGenericAwarenessModal,
  resolveGenericAwarenessModalContentVariant,
  selectGenericAwarenessModalCampaignId,
  selectIsGenericAwarenessModalOpen,
  type GenericAwarenessModalContentVariant,
} from "./genericAwarenessModal";

export interface GenericAwarenessModalViewProps {
  isOpen: boolean;
  onClose: () => void;
  /** Parsed from `ledgerwallet://generic-awareness-modal?id=…` when opened via deeplink */
  campaignId: string | undefined;
  /** Locked while the dialog closes so clearing campaignId does not swap body content */
  contentVariant: GenericAwarenessModalContentVariant;
}

const useGenericAwarenessModalViewModel = (): GenericAwarenessModalViewProps => {
  const dispatch = useDispatch();
  const isOpen = useSelector(selectIsGenericAwarenessModalOpen);
  const campaignId = useSelector(selectGenericAwarenessModalCampaignId);
  const lockedContentVariantRef = useRef<GenericAwarenessModalContentVariant>("featureIntro");

  useEffect(() => {
    if (isOpen) {
      lockedContentVariantRef.current = resolveGenericAwarenessModalContentVariant(campaignId);
    }
  }, [isOpen, campaignId]);

  const contentVariant = isOpen
    ? resolveGenericAwarenessModalContentVariant(campaignId)
    : lockedContentVariantRef.current;

  const onClose = useCallback(() => {
    dispatch(closeGenericAwarenessModal());
  }, [dispatch]);

  return {
    isOpen,
    onClose,
    campaignId,
    contentVariant,
  };
};

export default useGenericAwarenessModalViewModel;
