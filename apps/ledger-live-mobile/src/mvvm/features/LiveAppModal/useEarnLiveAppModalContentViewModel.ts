import { useMemo } from "react";
import {
  stakeProgramsToEarnParam,
  getEthDepositScreenSetting,
} from "@ledgerhq/live-common/featureFlags/stakePrograms/index";
import { useWalletFeaturesConfig } from "@ledgerhq/live-common/featureFlags/index";
import useFeature from "@ledgerhq/live-common/featureFlags/useFeature";
import { useVersionedStakePrograms } from "LLM/hooks/useStake/useVersionedStakePrograms";
import type { ExtraInputs } from "./useLiveAppModalContentViewModel";
import { computeEarnUiVersion } from "@ledgerhq/live-common/domain/computeEarnUiVersion";

export interface EarnLiveAppModalContentViewModel {
  extraInputs: ExtraInputs;
}

const useEarnLiveAppModalContentViewModel = (): EarnLiveAppModalContentViewModel => {
  const {
    isEnabled: isLwm40Enabled,
    shouldDisplayEarnSimulator,
    shouldDisplayEarnUpselling,
  } = useWalletFeaturesConfig("mobile");
  const stakePrograms = useVersionedStakePrograms();
  const earnUiVersion = useFeature("ptxEarnUi");
  const computedUiVersion = computeEarnUiVersion({
    baseUiVersion: earnUiVersion?.params?.value ?? "v2",
    shouldDisplayEarnUpselling,
    shouldDisplayEarnSimulator,
  });

  const extraInputs = useMemo<ExtraInputs>(() => {
    const { stakeProgramsParam } = stakeProgramsToEarnParam(stakePrograms);
    const stakeCurrenciesParam = stakePrograms?.params?.list;
    const ethDepositCohort = getEthDepositScreenSetting(stakePrograms);
    return {
      uiVersion: isLwm40Enabled ? computedUiVersion : "v1",
      lw40enabled: isLwm40Enabled ? "true" : "false",
      ethDepositCohort,
      stakeProgramsParam: stakeProgramsParam ? JSON.stringify(stakeProgramsParam) : undefined,
      stakeCurrenciesParam: stakeCurrenciesParam?.length
        ? JSON.stringify(stakeCurrenciesParam)
        : undefined,
    };
  }, [stakePrograms, isLwm40Enabled, computedUiVersion]);

  return { extraInputs };
};

export default useEarnLiveAppModalContentViewModel;
