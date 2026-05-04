import { useMemo } from "react";
import {
  stakeProgramsToEarnParam,
  getEthDepositScreenSetting,
} from "@ledgerhq/live-common/featureFlags/stakePrograms/index";
import { useWalletFeaturesConfig } from "@ledgerhq/live-common/featureFlags/index";
import useFeature from "@ledgerhq/live-common/featureFlags/useFeature";
import { useVersionedStakePrograms } from "LLM/hooks/useStake/useVersionedStakePrograms";
import type { ExtraInputs } from "./useLiveAppModalContentViewModel";

export interface EarnLiveAppModalContentViewModel {
  extraInputs: ExtraInputs;
}

const useEarnLiveAppModalContentViewModel = (): EarnLiveAppModalContentViewModel => {
  const { isEnabled: isLwm40Enabled } = useWalletFeaturesConfig("mobile");
  const stakePrograms = useVersionedStakePrograms();
  const earnUiVersion = useFeature("ptxEarnUi")?.params?.value ?? "v1";

  const extraInputs = useMemo<ExtraInputs>(() => {
    const { stakeProgramsParam } = stakeProgramsToEarnParam(stakePrograms);
    const stakeCurrenciesParam = stakePrograms?.params?.list;
    const ethDepositCohort = getEthDepositScreenSetting(stakePrograms);
    return {
      uiVersion: earnUiVersion,
      lw40enabled: isLwm40Enabled ? "true" : "false",
      ethDepositCohort,
      stakeProgramsParam: stakeProgramsParam ? JSON.stringify(stakeProgramsParam) : undefined,
      stakeCurrenciesParam: stakeCurrenciesParam?.length
        ? JSON.stringify(stakeCurrenciesParam)
        : undefined,
    };
  }, [stakePrograms, isLwm40Enabled, earnUiVersion]);

  return { extraInputs };
};

export default useEarnLiveAppModalContentViewModel;
