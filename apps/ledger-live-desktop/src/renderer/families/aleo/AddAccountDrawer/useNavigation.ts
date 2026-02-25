import { useGenericNavigation } from "LLD/features/ModularDrawer/hooks/useModularDrawerNavigation";
import { NAVIGATION_DIRECTION } from "LLD/features/ModularDrawer/types";
import { ALEO_ADD_ACCOUNT_STEP_ORDER, ALEO_MODULAR_DRAWER_ADD_ACCOUNT_STEP } from "./domain";

export function useNavigation() {
  return useGenericNavigation({
    backwardDirection: NAVIGATION_DIRECTION.BACKWARD,
    forwardDirection: NAVIGATION_DIRECTION.FORWARD,
    initialStep: ALEO_MODULAR_DRAWER_ADD_ACCOUNT_STEP.CONNECT_YOUR_DEVICE,
    stepOrder: ALEO_ADD_ACCOUNT_STEP_ORDER,
  });
}
