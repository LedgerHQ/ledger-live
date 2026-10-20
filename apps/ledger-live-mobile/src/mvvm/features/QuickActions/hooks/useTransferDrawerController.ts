import { useCallback, useEffect, useRef } from "react";
import { useSelector, useDispatch } from "~/context/hooks";
import {
  openTransferDrawer,
  closeTransferDrawer,
  transferDrawerStateSelector,
  type TransferDrawerScope,
} from "~/reducers/transferDrawer";

interface OpenDrawerParams {
  sourceScreenName: string;
  scope: TransferDrawerScope;
}

export const useTransferDrawerController = () => {
  const dispatch = useDispatch();

  const { isOpen, sourceScreenName, scope } = useSelector(transferDrawerStateSelector);
  // Stores a tap that arrived while the drawer was still open/animating,
  // so it can be replayed as soon as isOpen transitions to false.
  const pendingOpenRef = useRef<OpenDrawerParams | null>(null);

  const openDrawer = useCallback(
    (params: OpenDrawerParams) => {
      if (isOpen) {
        pendingOpenRef.current = params;
        dispatch(closeTransferDrawer());
      } else {
        dispatch(openTransferDrawer(params));
      }
    },
    [dispatch, isOpen],
  );

  useEffect(() => {
    if (!isOpen && pendingOpenRef.current) {
      const pending = pendingOpenRef.current;
      pendingOpenRef.current = null;
      dispatch(openTransferDrawer(pending));
    }
  }, [isOpen, dispatch]);

  const closeDrawer = useCallback(() => {
    dispatch(closeTransferDrawer());
  }, [dispatch]);

  // Replay a pending open request once the drawer has fully closed.
  // This handles the case where the user taps Transfer while the dismiss
  // animation is still running (backdrop disappears before JS onDismiss fires).
  useEffect(() => {
    if (!isOpen && pendingOpenRef.current) {
      const params = pendingOpenRef.current;
      pendingOpenRef.current = null;
      dispatch(openTransferDrawer(params));
    }
  }, [isOpen, dispatch]);

  return {
    isOpen,
    sourceScreenName,
    scope,
    openDrawer,
    closeDrawer,
  };
};
