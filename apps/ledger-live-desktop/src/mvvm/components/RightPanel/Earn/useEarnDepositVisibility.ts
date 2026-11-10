import { useFeature } from "@features/platform-feature-flags";

/** Opt-in via `ptxEarnLiveApp.params.homeDepositWidget`. Off by default. */
export const useEarnDepositVisibility = (): boolean => {
  const earnFlag = useFeature("ptxEarnLiveApp");
  return !!earnFlag?.enabled && earnFlag.params?.homeDepositWidget === true;
};
