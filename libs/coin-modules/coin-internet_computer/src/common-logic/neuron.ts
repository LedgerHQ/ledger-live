import { ICPAccount } from "../types";
import { getTimeUntil } from "@zondax/ledger-live-icp/utils";

import { LAST_SYNC_THRESHOLD_IN_DAYS } from "../consts";

import { votingPowerNeedsRefresh } from "@zondax/ledger-live-icp/neurons";

type BannerState =
  | "confirm_following"
  | "sync_neurons"
  | "lock_neurons"
  | "add_followees"
  | "stake_icp";
interface getBannerStateReturn {
  state: BannerState;
  data?: {
    days: number;
    hours: number;
    minutes: number;
  };
}
export const getBannerState = (account: ICPAccount): getBannerStateReturn => {
  // Check Neuron Periodic Confirmation (Priority 1)
  const { needsRefresh, minDays, minHours, minMinutes } = votingPowerNeedsRefresh(
    account.neurons.fullNeurons,
  );
  if (needsRefresh) {
    return {
      state: "confirm_following",
      data: {
        days: minDays,
        hours: minHours,
        minutes: minMinutes,
      },
    };
  }

  // Check Last Time Neurons Sync (Priority 2)
  const lastSync = account.neurons.lastUpdatedMSecs;
  const { days, hours, minutes } = getTimeUntil(lastSync / 1000, true);
  if (lastSync && days > LAST_SYNC_THRESHOLD_IN_DAYS) {
    return {
      state: "sync_neurons",
      data: {
        days,
        hours,
        minutes,
      },
    };
  }

  // Check Lock Neurons (Priority 3)
  const hasUnlockedNeurons = account.neurons.fullNeurons.some(
    neuron => neuron.dissolveState === "Unlocked",
  );
  if (hasUnlockedNeurons) {
    return {
      state: "lock_neurons",
    };
  }

  // Check Add Followees (Priority 4)
  const hasNeuronsWithoutFollowees = account.neurons.fullNeurons.some(
    neuron => neuron.followees.length === 0,
  );
  if (hasNeuronsWithoutFollowees) {
    return {
      state: "add_followees",
    };
  }

  // Check Stake ICP (Priority 5)
  if (account.balance.gt(1)) {
    return {
      state: "stake_icp",
    };
  }

  // No banner needed
  return {
    state: "sync_neurons",
  };
};

export {
  neuronPotentialVotingPower,
  getNeuronDissolveDuration,
  getSecondsTillVotingPowerExpires,
  getNeuronVotingPower,
  getNeuronAgeBonus,
  getMinDissolveDelay,
  getNeuronDissolveDelayBonus,
  canSplitNeuron,
  canSpawnNeuron,
  canStakeMaturity,
  maxAllowedSplitAmount,
  isDeviceControlledNeuron,
  NeuronsData,
} from "@zondax/ledger-live-icp/neurons";
