import { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { collectiblesViewModeSelector } from "~/renderer/reducers/settings";
import { setCollectiblesViewMode } from "~/renderer/actions/settings";
import type { Layout } from "LLD/features/Collectibles/types/Layouts";

const useLayout = () => {
  const dispatch = useDispatch();
  const collectiblesViewMode = useSelector(collectiblesViewModeSelector);
  const setViewMode = useCallback(
    (mode: Layout) => dispatch(setCollectiblesViewMode(mode)),
    [dispatch],
  );

  return { collectiblesViewMode, setViewMode };
};

export default useLayout;
