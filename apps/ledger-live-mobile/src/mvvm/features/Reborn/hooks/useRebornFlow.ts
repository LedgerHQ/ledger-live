import { useRebornBuyDeviceDrawerController } from "LLM/features/Reborn/hooks/useRebornBuyDeviceDrawerController";

export function useRebornFlow() {
  const { openDrawer: openRebornBuyDeviceDrawer } = useRebornBuyDeviceDrawerController();

  return {
    navigateToRebornFlow: openRebornBuyDeviceDrawer,
  };
}
