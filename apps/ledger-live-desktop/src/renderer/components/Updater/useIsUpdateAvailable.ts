import { useUpdaterStatus } from "LLD/features/Updater/hooks/useUpdaterStatus";

const useIsUpdateAvailable = () => {
  const { isBannerVisible } = useUpdaterStatus();
  return isBannerVisible;
};
export default useIsUpdateAvailable;
