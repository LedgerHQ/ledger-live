import { setDrawerVisibility } from "~/renderer/actions/hodlShield";
import { useDispatch } from "react-redux";
import { useFlows } from "./useFlow";

export function useActivationDrawer() {
  const dispatch = useDispatch();
  const { goToWelcomeScreenWalletSync } = useFlows();

  const openDrawer = () => {
    console.log("Opening drawer");
    goToWelcomeScreenWalletSync();
    dispatch(setDrawerVisibility(true));
  };

  const closeDrawer = () => {
    dispatch(setDrawerVisibility(false));
  };

  return {
    openDrawer,
    closeDrawer,
  };
}
