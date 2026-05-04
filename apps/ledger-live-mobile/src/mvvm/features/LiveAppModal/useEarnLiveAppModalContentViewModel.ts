import { useMemo } from "react";
import {
  stakeProgramsToEarnParam,
  getEthDepositScreenSetting,
} from "@ledgerhq/live-common/featureFlags/stakePrograms/index";
import { useWalletFeaturesConfig } from "@ledgerhq/live-common/featureFlags/index";
import { useVersionedStakePrograms } from "LLM/hooks/useStake/useVersionedStakePrograms";
import type { ExtraInputs } from "./useLiveAppModalContentViewModel";

export interface EarnLiveAppModalContentViewModel {
  extraInputs: ExtraInputs;
}

const useEarnLiveAppModalContentViewModel = (): EarnLiveAppModalContentViewModel => {
  const { isEnabled: isLwm40Enabled } = useWalletFeaturesConfig("mobile");
  const stakePrograms = useVersionedStakePrograms();

  const extraInputs = useMemo<ExtraInputs>(() => {
    const { stakeProgramsParam } = stakeProgramsToEarnParam(stakePrograms);
    const stakeCurrenciesParam = stakePrograms?.params?.list;
    const ethDepositCohort = getEthDepositScreenSetting(stakePrograms);
    return {
      uiVersion: isLwm40Enabled ? "v2" : "v1",
      lw40enabled: isLwm40Enabled ? "true" : "false",
      ethDepositCohort,
      stakeProgramsParam: stakeProgramsParam ? JSON.stringify(stakeProgramsParam) : undefined,
      stakeCurrenciesParam: stakeCurrenciesParam?.length
        ? JSON.stringify(stakeCurrenciesParam)
        : undefined,
    };
  }, [stakePrograms, isLwm40Enabled]);

  return { extraInputs };
};

export default useEarnLiveAppModalContentViewModel;
