import { getTimeUntil } from "@zondax/ledger-live-icp/utils";
import { ICPAccount, ICPNeuron } from "../types";

import { LAST_SYNC_THRESHOLD_IN_DAYS } from "../consts";

import { votingPowerNeedsRefresh } from "@zondax/ledger-live-icp/neurons";

/**
 * Neuron action permissions based on dissolve state
 */
export type NeuronActionPermissions = {
  canDisburse: boolean;
  canStartDissolving: boolean;
  canStopDissolving: boolean;
};

/**
 * Get neuron action permissions based on its dissolve state
 * @param neuron - The neuron to check
 * @returns Object with boolean flags for each action
 */
export function getNeuronActionPermissions(neuron: ICPNeuron): NeuronActionPermissions {
  const basePermissions: NeuronActionPermissions = {
    canDisburse: false,
    canStartDissolving: false,
    canStopDissolving: false,
  };

  const dissolveState = neuron.dissolveState;
  if (!dissolveState) return basePermissions;

  switch (dissolveState) {
    case "Locked":
      return {
        ...basePermissions,
        canStartDissolving: true,
      };
    case "Dissolving":
      return {
        ...basePermissions,
        canStopDissolving: true,
      };
    case "Unlocked":
      return {
        ...basePermissions,
        canDisburse: true,
      };
    default:
      return basePermissions;
  }
}

/**
 * Check if neuron is unlocked (can set dissolve delay vs increase)
 * @param neuron - The neuron to check
 * @returns true if neuron is unlocked and dissolve delay should be "set", false if it should be "increased"
 */
export function isNeuronUnlocked(neuron: ICPNeuron): boolean {
  return neuron.dissolveState === "Unlocked";
}

/**
 * Check if neuron has any followees configured
 * @param neuron - The neuron to check
 * @returns true if neuron has at least one followee
 */
export function hasFollowees(neuron: ICPNeuron): boolean {
  return neuron.followees.length > 0;
}

type BannerState = "confirmFollowing" | "syncNeurons" | "lockNeurons" | "addFollowees" | "stakeICP";
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
      state: "confirmFollowing",
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
      state: "syncNeurons",
      data: {
        days,
        hours,
        minutes,
      },
    };
  }

  // Check Lock Neurons (Priority 3)
  const hasUnlockedNeurons = account.neurons.fullNeurons.some(isNeuronUnlocked);
  if (hasUnlockedNeurons) {
    return {
      state: "lockNeurons",
    };
  }

  // Check Add Followees (Priority 4)
  const hasNeuronsWithoutFollowees = account.neurons.fullNeurons.some(
    neuron => !hasFollowees(neuron),
  );
  if (hasNeuronsWithoutFollowees) {
    return {
      state: "addFollowees",
    };
  }

  // Check Stake ICP (Priority 5)
  if (account.balance.gt(1)) {
    return {
      state: "stakeICP",
    };
  }

  // No banner needed
  return {
    state: "stakeICP",
  };
};

export {
  canSpawnNeuron,
  canSplitNeuron,
  canStakeMaturity,
  getMinDissolveDelay,
  getNeuronAgeBonus,
  getNeuronDissolveDelayBonus,
  getNeuronDissolveDuration,
  getNeuronVotingPower,
  getSecondsTillVotingPowerExpires,
  isDeviceControlledNeuron,
  maxAllowedSplitAmount,
  neuronPotentialVotingPower,
  NeuronsData,
  votingPowerNeedsRefresh,
} from "@zondax/ledger-live-icp/neurons";
