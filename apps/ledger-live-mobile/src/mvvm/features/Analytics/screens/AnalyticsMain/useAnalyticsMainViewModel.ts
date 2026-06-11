import { useFeature } from "@features/platform-feature-flags";

const useAnalyticsMainViewModel = () => {
  const ptxServiceCtaExchangeDrawer = useFeature("ptxServiceCtaExchangeDrawer");
  const isExchangeEnabled = ptxServiceCtaExchangeDrawer?.enabled ?? true;
  return {
    isExchangeEnabled,
  };
};

export default useAnalyticsMainViewModel;
