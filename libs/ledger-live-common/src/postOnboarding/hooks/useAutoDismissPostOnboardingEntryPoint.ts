import { useSelector, useDispatch } from "react-redux";
import { entryPointFirstDisplayedDateSelector } from "../reducer";
import { useEffect } from "react";
import { hidePostOnboardingWalletEntryPoint } from "../actions";
import { usePostOnboardingEntryPointVisibleOnWallet } from "./usePostOnboardingEntryPointVisibleOnWallet";

const millisecondsInADay = 1000 * 60 * 60 * 24;

const isMoreThanSevenDaysAgo = (date: Date) => {
  if (!date) return false;

  const datePlusSevenDays = new Date(date).getTime() + 7 * millisecondsInADay;
  const today = new Date().getTime();

  return datePlusSevenDays < today;
};

export function useAutoDismissPostOnboardingEntryPoint() {
  const dispatch = useDispatch();
  const entryPointFirstDisplayedDate = useSelector(entryPointFirstDisplayedDateSelector);

  const isPostOnboardingEntryPointVisible = usePostOnboardingEntryPointVisibleOnWallet();

  useEffect(() => {
    if (isPostOnboardingEntryPointVisible && isMoreThanSevenDaysAgo(entryPointFirstDisplayedDate)) {
      dispatch(hidePostOnboardingWalletEntryPoint());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
