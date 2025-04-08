import BigNumber from "bignumber.js";
import { Delegation, StakeHistoryEntry } from "../account/stake";

export interface StakeActivatingAndDeactivating {
  effective: BigNumber;
  activating: BigNumber;
  deactivating: BigNumber;
}

interface EffectiveAndActivating {
  effective: BigNumber;
  activating: BigNumber;
}

function getStakeHistoryEntry(
  epoch: BigNumber,
  stakeHistory: StakeHistoryEntry[],
): StakeHistoryEntry | null {
  for (const entry of stakeHistory) {
    if (entry.epoch.eq(epoch)) {
      return entry;
    }
  }
  return null;
}

const WARMUP_COOLDOWN_RATE = 0.09;

function getStakeAndActivating(
  delegation: Delegation,
  targetEpoch: BigNumber,
  stakeHistory: StakeHistoryEntry[],
): EffectiveAndActivating {
  if (delegation.activationEpoch.eq(delegation.deactivationEpoch)) {
    // activated but instantly deactivated; no stake at all regardless of target_epoch
    return {
      effective: BigNumber(0),
      activating: BigNumber(0),
    };
  } else if (targetEpoch.eq(delegation.activationEpoch)) {
    // all is activating
    return {
      effective: BigNumber(0),
      activating: delegation.stake,
    };
  } else if (targetEpoch.lt(delegation.activationEpoch)) {
    // not yet enabled
    return {
      effective: BigNumber(0),
      activating: BigNumber(0),
    };
  }

  let currentEpoch = delegation.activationEpoch;
  let entry = getStakeHistoryEntry(currentEpoch, stakeHistory);
  if (entry !== null) {
    // target_epoch > self.activation_epoch

    // loop from my activation epoch until the target epoch summing up my entitlement
    // current effective stake is updated using its previous epoch's cluster stake
    let currentEffectiveStake = BigNumber(0);
    while (entry !== null) {
      currentEpoch = currentEpoch.plus(1);
      const remaining = delegation.stake.minus(currentEffectiveStake);
      const weight = remaining.div(entry.activating);
      const newlyEffectiveClusterStake = entry.effective.multipliedBy(WARMUP_COOLDOWN_RATE);
      const newlyEffectiveStake = BigNumber.max(
        BigNumber(1),
        weight.multipliedBy(newlyEffectiveClusterStake).integerValue(BigNumber.ROUND_HALF_CEIL),
      );

      currentEffectiveStake = currentEffectiveStake.plus(newlyEffectiveStake);
      if (currentEffectiveStake.gte(delegation.stake)) {
        currentEffectiveStake = delegation.stake;
        break;
      }

      if (currentEpoch.gte(targetEpoch) || currentEpoch.gte(delegation.deactivationEpoch)) {
        break;
      }
      entry = getStakeHistoryEntry(currentEpoch, stakeHistory);
    }
    return {
      effective: currentEffectiveStake,
      activating: delegation.stake.minus(currentEffectiveStake),
    };
  } else {
    // no history or I've dropped out of history, so assume fully effective
    return {
      effective: delegation.stake,
      activating: BigNumber(0),
    };
  }
}

export function getStakeActivatingAndDeactivating(
  delegation: Delegation,
  targetEpoch: BigNumber,
  stakeHistory: StakeHistoryEntry[],
): StakeActivatingAndDeactivating {
  const { effective, activating } = getStakeAndActivating(delegation, targetEpoch, stakeHistory);

  // then de-activate some portion if necessary
  if (targetEpoch.lt(delegation.deactivationEpoch)) {
    return {
      effective,
      activating,
      deactivating: BigNumber(0),
    };
  } else if (targetEpoch.eq(delegation.deactivationEpoch)) {
    // can only deactivate what's activated
    return {
      effective,
      activating: BigNumber(0),
      deactivating: effective,
    };
  }
  let currentEpoch = delegation.deactivationEpoch;
  let entry = getStakeHistoryEntry(currentEpoch, stakeHistory);
  if (entry !== null) {
    // target_epoch > self.activation_epoch
    // loop from my deactivation epoch until the target epoch
    // current effective stake is updated using its previous epoch's cluster stake
    let currentEffectiveStake = effective;
    while (entry !== null) {
      currentEpoch = currentEpoch.plus(1);
      // if there is no deactivating stake at prev epoch, we should have been
      // fully undelegated at this moment
      if (entry.deactivating.eq(0)) {
        break;
      }

      // I'm trying to get to zero, how much of the deactivation in stake
      //   this account is entitled to take
      const weight = currentEffectiveStake.div(entry.deactivating);

      // portion of newly not-effective cluster stake I'm entitled to at current epoch
      const newlyNotEffectiveClusterStake = entry.effective.multipliedBy(WARMUP_COOLDOWN_RATE);
      const newlyNotEffectiveStake = BigNumber.max(
        BigNumber(1),
        weight.multipliedBy(newlyNotEffectiveClusterStake).integerValue(BigNumber.ROUND_HALF_CEIL),
      );

      currentEffectiveStake = currentEffectiveStake.minus(newlyNotEffectiveStake);
      if (currentEffectiveStake.lte(0)) {
        currentEffectiveStake = BigNumber(0);
        break;
      }

      if (currentEpoch.gte(targetEpoch)) {
        break;
      }
      entry = getStakeHistoryEntry(currentEpoch, stakeHistory);
    }

    // deactivating stake should equal to all of currently remaining effective stake
    return {
      effective: currentEffectiveStake,
      deactivating: currentEffectiveStake,
      activating: BigNumber(0),
    };
  } else {
    return {
      effective: BigNumber(0),
      activating: BigNumber(0),
      deactivating: BigNumber(0),
    };
  }
}
