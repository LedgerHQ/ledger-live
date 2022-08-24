import { useCallback } from "react";
import { useDispatch } from "react-redux";
import { hidePostOnboardingWalletEntryPoint } from "../actions";

/**
 * @returns a function to hide the post onboarding entry point on the wallet
 * screen.
 */
export function useHideWalletEntryPointCallback(): () => void {
  const dispatch = useDispatch();
  return useCallback(() => {
    dispatch(hidePostOnboardingWalletEntryPoint());
  }, [dispatch]);
}
