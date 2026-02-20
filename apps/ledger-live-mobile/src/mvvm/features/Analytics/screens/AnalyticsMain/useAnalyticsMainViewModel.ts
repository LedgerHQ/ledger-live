import { useFeature } from "@ledgerhq/live-common/featureFlags/index";

const useAnalyticsMainViewModel = () => {
  const ptxServiceCtaExchangeDrawer = useFeature("ptxServiceCtaExchangeDrawer");
  const isExchangeEnabled = ptxServiceCtaExchangeDrawer?.enabled ?? true;
  return {
    isExchangeEnabled,
  };
};

export default useAnalyticsMainViewModel;
