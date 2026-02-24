import { useDispatch } from "LLD/hooks/redux";
import { useCallback } from "react";
import { openBuyDevice } from "../buyDeviceDialog";

const useBuyDeviceDrawer = () => {
  const dispatch = useDispatch();

  const handleOpen = useCallback(() => {
    dispatch(openBuyDevice());
  }, [dispatch]);

  return { handleOpen };
};

export default useBuyDeviceDrawer;
