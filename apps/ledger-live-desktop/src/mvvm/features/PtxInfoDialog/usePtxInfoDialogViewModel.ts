import { useCallback } from "react";
import { useSelector, useDispatch } from "LLD/hooks/redux";
import {
  selectPtxInfoDialogData,
  selectIsPtxInfoDialogOpen,
  clearPtxInfoDialog,
} from "~/renderer/reducers/ptxInfoDialog";
import { openURL } from "~/renderer/linking";

export interface PtxInfoDialogViewProps {
  isOpen: boolean;
  title: string;
  message: string;
  linkText?: string;
  onClose: () => void;
  onLinkPress?: () => void;
}

const usePtxInfoDialogViewModel = (): PtxInfoDialogViewProps => {
  const dispatch = useDispatch();
  const isOpen = useSelector(selectIsPtxInfoDialogOpen);
  const data = useSelector(selectPtxInfoDialogData);

  const onClose = useCallback(() => {
    dispatch(clearPtxInfoDialog());
  }, [dispatch]);

  const onLinkPress = useCallback(() => {
    if (data?.linkHref) {
      openURL(data.linkHref);
    }
  }, [data?.linkHref]);

  return {
    isOpen,
    title: data?.title ?? "",
    message: data?.message ?? "",
    linkText: data?.linkText,
    onClose,
    onLinkPress: data?.linkHref ? onLinkPress : undefined,
  };
};

export default usePtxInfoDialogViewModel;
