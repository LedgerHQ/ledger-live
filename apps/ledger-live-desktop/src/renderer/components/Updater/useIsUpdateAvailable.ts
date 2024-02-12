import { useContext } from "react";
import { UpdaterContext } from "./UpdaterContext";
import { VISIBLE_STATUS } from "./Banner";

const useIsUpdateAvailable = () => {
  const context = useContext(UpdaterContext);
  return context && context.version && VISIBLE_STATUS.includes(context.status);
};
export default useIsUpdateAvailable;
