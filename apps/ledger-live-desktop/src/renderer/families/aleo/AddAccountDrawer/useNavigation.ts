import { useGenericNavigation } from "LLD/features/AddAccountDrawer/hooks/useGenericNavigation";
import { NAVIGATION_DIRECTION } from "LLD/features/AddAccountDrawer/components/AnimatedScreenWrapper";
import { ALEO_ADD_ACCOUNT_STEP_ORDER, ALEO_MODULAR_DRAWER_ADD_ACCOUNT_STEP } from "./domain";

export function useNavigation() {
  return useGenericNavigation({
    backwardDirection: NAVIGATION_DIRECTION.BACKWARD,
    forwardDirection: NAVIGATION_DIRECTION.FORWARD,
    initialStep: ALEO_MODULAR_DRAWER_ADD_ACCOUNT_STEP.CONNECT_YOUR_DEVICE,
    stepOrder: ALEO_ADD_ACCOUNT_STEP_ORDER,
  });
}
