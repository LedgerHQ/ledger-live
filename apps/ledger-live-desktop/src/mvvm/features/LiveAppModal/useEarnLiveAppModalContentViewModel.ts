import { useMemo } from "react";
import {
  stakeProgramsToEarnParam,
  getEthDepositScreenSetting,
} from "@ledgerhq/live-common/featureFlags/stakePrograms/index";
import { useFeature, useWalletFeaturesConfig } from "@ledgerhq/live-common/featureFlags/index";
import { useVersionedStakePrograms } from "LLD/hooks/useVersionedStakePrograms";
import type { ExtraInputs } from "./useLiveAppModalContentViewModel";

export interface EarnLiveAppModalContentViewModel {
  extraInputs: ExtraInputs;
}

const useEarnLiveAppModalContentViewModel = (): EarnLiveAppModalContentViewModel => {
  const { isEnabled: isLwd40Enabled } = useWalletFeaturesConfig("desktop");
  const earnUiFlag = useFeature("ptxEarnUi");
  const earnUiVersion = earnUiFlag?.params?.value ?? "v1";
  const stakePrograms = useVersionedStakePrograms();

  const extraInputs = useMemo<ExtraInputs>(() => {
    const { stakeProgramsParam, stakeCurrenciesParam } = stakeProgramsToEarnParam(stakePrograms);
    const ethDepositCohort = getEthDepositScreenSetting(stakePrograms);
    return {
      uiVersion: isLwd40Enabled ? earnUiVersion : "v1",
      lw40enabled: isLwd40Enabled ? "true" : "false",
      ethDepositCohort,
      stakeProgramsParam: stakeProgramsParam ? JSON.stringify(stakeProgramsParam) : undefined,
      stakeCurrenciesParam: stakeCurrenciesParam ? JSON.stringify(stakeCurrenciesParam) : undefined,
    };
  }, [stakePrograms, isLwd40Enabled, earnUiVersion]);

  return { extraInputs };
};

export default useEarnLiveAppModalContentViewModel;
