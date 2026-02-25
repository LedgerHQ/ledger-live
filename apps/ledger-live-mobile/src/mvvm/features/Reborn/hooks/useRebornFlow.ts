import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import { useRebornBuyDeviceDrawerController } from "LLM/features/Reborn/hooks/useRebornBuyDeviceDrawerController";

export function useRebornFlow() {
  const rebornFeatureFlag = useFeature("llmRebornLP");
  const featureFlagEnabled = rebornFeatureFlag?.enabled;
  const { openDrawer: openRebornBuyDeviceDrawer } = useRebornBuyDeviceDrawerController();

  return {
    navigateToRebornFlow: openRebornBuyDeviceDrawer,
    rebornFeatureFlagEnabled: featureFlagEnabled,
  };
}
