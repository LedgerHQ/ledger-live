import { useCallback } from "react";
import { useDispatch, useSelector } from "LLD/hooks/redux";
import { dismiss as dismissRequest } from "@ledgerhq/live-common/wallet-api/LiveAppModal/registry";
import {
  selectLiveAppModal,
  setLiveAppModal,
  type LiveAppModalParams,
} from "~/renderer/reducers/liveAppModal";

export interface LiveAppModalViewProps {
  isOpen: boolean;
  params: LiveAppModalParams | null;
  onOpenChange: (open: boolean) => void;
  onClose: () => void;
}

const useLiveAppModalViewModel = (): LiveAppModalViewProps => {
  const dispatch = useDispatch();
  const params = useSelector(selectLiveAppModal);
  const isOpen = params != null;

  const onClose = useCallback(() => {
    if (params) dismissRequest(params.requestId);
    dispatch(setLiveAppModal(null));
  }, [dispatch, params]);

  const onOpenChange = useCallback(
    (open: boolean) => {
      if (!open) onClose();
    },
    [onClose],
  );

  return { isOpen, params, onOpenChange, onClose };
};

export default useLiveAppModalViewModel;
