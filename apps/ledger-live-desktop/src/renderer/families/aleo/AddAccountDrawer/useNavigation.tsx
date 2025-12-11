import { useGenericNavigation } from "LLD/features/ModularDrawer/hooks/useModularDrawerNavigation";
import { NAVIGATION_DIRECTION } from "LLD/features/ModularDrawer/types";
import { MODULAR_DRAWER_ADD_ACCOUNT_STEP } from "LLD/features/AddAccountDrawer/domain";
import { ALEO_ADD_ACCOUNT_STEP_ORDER } from "./domain";

export function useNavigation() {
  return useGenericNavigation({
    backwardDirection: NAVIGATION_DIRECTION.BACKWARD,
    forwardDirection: NAVIGATION_DIRECTION.FORWARD,
    initialStep: MODULAR_DRAWER_ADD_ACCOUNT_STEP.CONNECT_YOUR_DEVICE,
    stepOrder: ALEO_ADD_ACCOUNT_STEP_ORDER,
  });
}
