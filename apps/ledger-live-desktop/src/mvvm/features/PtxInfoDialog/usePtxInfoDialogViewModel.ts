import { useCallback } from "react";
import { useSelector, useDispatch } from "LLD/hooks/redux";
import {
  selectPtxInfoDialogData,
  selectIsPtxInfoDialogOpen,
  clearPtxInfoDialog,
} from "~/renderer/reducers/ptxInfoDialog";
import { openURL } from "~/renderer/linking";
import { useLocalizedUrl } from "~/renderer/hooks/useLocalizedUrls";

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

  const localizedLinkHref = useLocalizedUrl(data?.linkHref ?? "");
  const onLinkPress = useCallback(() => {
    if (localizedLinkHref) {
      openURL(localizedLinkHref);
    }
  }, [localizedLinkHref]);

  return {
    isOpen,
    title: data?.title ?? "",
    message: data?.message ?? "",
    linkText: data?.linkText,
    onClose,
    onLinkPress: localizedLinkHref ? onLinkPress : undefined,
  };
};

export default usePtxInfoDialogViewModel;
