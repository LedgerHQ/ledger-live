import { useSelector, useDispatch } from "react-redux";
import { entryPointFirstDisplayedDateSelector } from "../reducer";
import { useEffect } from "react";
import { hidePostOnboardingWalletEntryPoint } from "../actions";
import { usePostOnboardingEntryPointVisibleOnWallet } from "./usePostOnboardingEntryPointVisibleOnWallet";

const millisecondsInADay = 1000 * 60 * 60 * 24;
const autoDismissAfterDays = 15;

const isFirstDisplayedPastAutoDismissWindow = (firstDisplayed: Date | null) => {
  if (!firstDisplayed) return false;

  const windowEndMs =
    new Date(firstDisplayed).getTime() + autoDismissAfterDays * millisecondsInADay;

  return windowEndMs < Date.now();
};

export function useAutoDismissPostOnboardingEntryPoint() {
  const dispatch = useDispatch();
  const entryPointFirstDisplayedDate = useSelector(entryPointFirstDisplayedDateSelector);

  const isPostOnboardingEntryPointVisible = usePostOnboardingEntryPointVisibleOnWallet();

  useEffect(() => {
    if (
      isPostOnboardingEntryPointVisible &&
      isFirstDisplayedPastAutoDismissWindow(entryPointFirstDisplayedDate)
    ) {
      dispatch(hidePostOnboardingWalletEntryPoint());
    }
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
