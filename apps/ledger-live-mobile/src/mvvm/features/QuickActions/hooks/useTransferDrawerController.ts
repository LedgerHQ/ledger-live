import { useCallback } from "react";
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

  const openDrawer = useCallback(
    (params: OpenDrawerParams) => {
      dispatch(
        openTransferDrawer({
          sourceScreenName: params.sourceScreenName,
        }),
      );
    },
    [dispatch],
  );

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
