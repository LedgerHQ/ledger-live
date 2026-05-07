import { useCallback, useEffect, useRef } from "react";
import { dismiss as dismissRequest } from "@ledgerhq/live-common/wallet-api/LiveAppModal/registry";
import { useDispatch, useSelector } from "~/context/hooks";
import {
  selectLiveAppModal,
  setLiveAppModal,
  type LiveAppModalParams,
} from "~/reducers/liveAppModal";
import { ScreenName } from "~/const";
import { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";
import { StackNavigatorProps } from "~/components/RootNavigator/types/helpers";

type Navigation = StackNavigatorProps<
  BaseNavigatorStackParamList,
  ScreenName.LiveAppModal
>["navigation"];

export interface LiveAppModalViewProps {
  params: LiveAppModalParams | null;
  onClose: () => void;
}

const useLiveAppModalViewModel = (navigation: Navigation): LiveAppModalViewProps => {
  const dispatch = useDispatch();
  const params = useSelector(selectLiveAppModal);
  const requestIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (params) requestIdRef.current = params.requestId;
  }, [params]);

  const onClose = useCallback(() => {
    dispatch(setLiveAppModal(null));
    navigation.goBack();
  }, [dispatch, navigation]);

  useEffect(() => {
    // Safety net: if the screen unmounts for any reason (system back,
    // swipe-to-dismiss, navigation reset), resolve the pending registry
    // entry so the live-app's RPC promise settles, and clear Redux state
    // so a later remount doesn't replay the previous modal.
    return () => {
      if (requestIdRef.current) {
        dismissRequest(requestIdRef.current);
      }
      dispatch(setLiveAppModal(null));
    };
  }, [dispatch]);

  return { params, onClose };
};

export default useLiveAppModalViewModel;
