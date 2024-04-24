import { useSelector, useDispatch } from "react-redux";
import {
  entryPointFirstDisplayedDateSelector,
  postOnboardingDeviceModelIdSelector,
  walletPostOnboardingEntryPointDismissedSelector,
} from "../reducer";
import { useAllPostOnboardingActionsCompleted } from "./useAllPostOnboardingActionsCompleted";
import { useEffect } from "react";
import { hidePostOnboardingWalletEntryPoint } from "../actions";

const millisecondsInADay = 1000 * 60 * 60 * 24;

const isMoreThanSevenDaysAgo = (date: Date) => {
  if (!date) return false;

  const datePlusSevenDays = new Date(date).getTime() + 7 * millisecondsInADay;
  const today = new Date().getTime();

  return datePlusSevenDays < today;
};

/**
 *
 * @returns a boolean representing whether the post onboarding entry point
 * should be visible on the wallet page.
 */
export function usePostOnboardingEntryPointVisibleOnWallet(): boolean {
  const dispatch = useDispatch();
  const deviceModelId = useSelector(postOnboardingDeviceModelIdSelector);
  const dismissed = useSelector(walletPostOnboardingEntryPointDismissedSelector);
  const allCompleted = useAllPostOnboardingActionsCompleted();
  const entryPointFirstDisplayedDate = useSelector(entryPointFirstDisplayedDateSelector);

  const isPostOnboardingEntryPointVisible = !!deviceModelId && !(dismissed || allCompleted);

  useEffect(() => {
    if (isPostOnboardingEntryPointVisible && isMoreThanSevenDaysAgo(entryPointFirstDisplayedDate)) {
      dispatch(hidePostOnboardingWalletEntryPoint());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return isPostOnboardingEntryPointVisible;
}
