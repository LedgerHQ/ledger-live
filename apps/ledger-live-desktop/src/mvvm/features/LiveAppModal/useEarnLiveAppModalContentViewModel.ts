import { useMemo } from "react";
import {
  stakeProgramsToEarnParam,
  getEthDepositScreenSetting,
} from "@ledgerhq/live-common/featureFlags/stakePrograms/index";
import { useFeature, useWalletFeaturesConfig } from "@ledgerhq/live-common/featureFlags/index";
import { useVersionedStakePrograms } from "LLD/hooks/useVersionedStakePrograms";
import type { ExtraInputs } from "./useLiveAppModalContentViewModel";
import { computeEarnUiVersion } from "@ledgerhq/live-common/domain/computeEarnUiVersion";

export interface EarnLiveAppModalContentViewModel {
  extraInputs: ExtraInputs;
}

const useEarnLiveAppModalContentViewModel = (): EarnLiveAppModalContentViewModel => {
  const {
    isEnabled: isLwd40Enabled,
    shouldDisplayEarnSimulator,
    shouldDisplayEarnUpselling,
  } = useWalletFeaturesConfig("desktop");
  const earnUiFlag = useFeature("ptxEarnUi");
  const computedUiVersion = computeEarnUiVersion({
    baseUiVersion: earnUiFlag?.params?.value ?? "v2",
    shouldDisplayEarnUpselling,
    shouldDisplayEarnSimulator,
  });
  const stakePrograms = useVersionedStakePrograms();

  const extraInputs = useMemo<ExtraInputs>(() => {
    const { stakeProgramsParam, stakeCurrenciesParam } = stakeProgramsToEarnParam(stakePrograms);
    const ethDepositCohort = getEthDepositScreenSetting(stakePrograms);
    return {
      uiVersion: isLwd40Enabled ? computedUiVersion : "v1",
      lw40enabled: isLwd40Enabled ? "true" : "false",
      ethDepositCohort,
      stakeProgramsParam: stakeProgramsParam ? JSON.stringify(stakeProgramsParam) : undefined,
      stakeCurrenciesParam: stakeCurrenciesParam ? JSON.stringify(stakeCurrenciesParam) : undefined,
    };
  }, [stakePrograms, isLwd40Enabled, computedUiVersion]);

  return { extraInputs };
};

export default useEarnLiveAppModalContentViewModel;
