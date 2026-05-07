import { useGenericNavigation } from "LLD/features/AddAccountDrawer/hooks/useGenericNavigation";
import { NAVIGATION_DIRECTION } from "LLD/features/AddAccountDrawer/components/AnimatedScreenWrapper";
import { CANTON_ADD_ACCOUNT_STEP_ORDER, CANTON_MODULAR_DRAWER_ADD_ACCOUNT_STEP } from "../domain";

export function useNavigation() {
  return useGenericNavigation({
    backwardDirection: NAVIGATION_DIRECTION.BACKWARD,
    forwardDirection: NAVIGATION_DIRECTION.FORWARD,
    initialStep: CANTON_MODULAR_DRAWER_ADD_ACCOUNT_STEP.DISCLAIMER,
    stepOrder: CANTON_ADD_ACCOUNT_STEP_ORDER,
  });
}
