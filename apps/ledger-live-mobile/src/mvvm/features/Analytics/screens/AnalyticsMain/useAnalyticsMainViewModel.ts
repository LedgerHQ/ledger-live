import { useFeature } from "@features/platform-feature-flags";

const useAnalyticsMainViewModel = () => {
  const ptxServiceCtaExchangeDrawer = useFeature("ptxServiceCtaExchangeDrawer");
  const isExchangeEnabled = ptxServiceCtaExchangeDrawer?.enabled ?? true;
  const isAccountAnalyticsEnabled = useFeature("accountDetail")?.enabled ?? false;
  return {
    isExchangeEnabled,
    isAccountAnalyticsEnabled,
  };
};

export default useAnalyticsMainViewModel;
