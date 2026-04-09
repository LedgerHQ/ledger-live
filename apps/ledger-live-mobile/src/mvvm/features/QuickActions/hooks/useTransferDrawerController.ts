import { useCallback, useEffect, useRef } from "react";
import { useSelector, useDispatch } from "~/context/hooks";
import {
  openTransferDrawer,
  closeTransferDrawer,
  transferDrawerStateSelector,
} from "~/reducers/transferDrawer";

interface OpenDrawerParams {
  sourceScreenName: string;
}

export const useTransferDrawerController = () => {
  const dispatch = useDispatch();

  const { isOpen, sourceScreenName } = useSelector(transferDrawerStateSelector);
  const pendingOpenRef = useRef<OpenDrawerParams | null>(null);

  const openDrawer = useCallback(
    (params: OpenDrawerParams) => {
      if (isOpen) {
        pendingOpenRef.current = params;
        dispatch(closeTransferDrawer());
      } else {
        dispatch(
          openTransferDrawer({
            sourceScreenName: params.sourceScreenName,
          }),
        );
      }
    },
    [dispatch, isOpen],
  );

  useEffect(() => {
    if (!isOpen && pendingOpenRef.current) {
      const pending = pendingOpenRef.current;
      pendingOpenRef.current = null;
      dispatch(
        openTransferDrawer({
          sourceScreenName: pending.sourceScreenName,
        }),
      );
    }
  }, [isOpen, dispatch]);

  const closeDrawer = useCallback(() => {
    dispatch(closeTransferDrawer());
  }, [dispatch]);

  return {
    isOpen,
    sourceScreenName,
    openDrawer,
    closeDrawer,
  };
};
