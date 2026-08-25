import { Principal } from "@dfinity/principal";
import {
  E8S_PER_ICP,
  ICP_FEES,
  LAST_SYNC_THRESHOLD_IN_DAYS,
  MIN_NEURON_STAKE,
  NNS_CLEAR_FOLLOWING_AFTER_SECONDS,
  NNS_MAXIMUM_DISSOLVE_DELAY,
  NNS_MINIMUM_DISSOLVE_DELAY_TO_VOTE,
  NNS_START_REDUCING_VOTING_POWER_AFTER_SECONDS,
  SECONDS_IN_DAY,
  SECONDS_IN_FOUR_YEARS,
  SECONDS_IN_MONTH,
  SECONDS_IN_YEAR,
  SECONDS_IN_7_DAYS,
} from "../consts";
import {
  ICPNeuron,
  ListNeuronsResponse,
  NeuronsData,
  NeuronState,
  RawNeuron,
} from "../types/neuron";
import {
  ageMultiplier,
  bonusMultiplier,
  dissolveDelayMultiplier,
  getBannerState,
  getNeuronActionPermissions,
  getNeuronDissolveDurationSeconds,
  getSecondsTillVotingPowerExpires,
  hasEnoughMaturityToStake,
  isDeviceControlledNeuron,
  isEnoughMaturityToSpawn,
  maxAllowedSplitAmount,
  minAllowedSplitAmount,
  minNeuronSplittable,
  neuronCanBeSplit,
  neuronCanVote,
  neuronDecidingVotingPower,
  neuronPotentialVotingPower,
  neuronsNeedSync,
  neuronStake,
  secondsToDuration,
  toNeuronsData,
  votingPowerNeedsRefresh,
} from "./neuron";

const baseNeuron = (overrides: Partial<ICPNeuron> = {}): ICPNeuron => ({
  id: 1n,
  accountIdentifier: "ab".repeat(32),
  state: NeuronState.Locked,
  dissolveDelaySeconds: BigInt(NNS_MAXIMUM_DISSOLVE_DELAY),
  ageSeconds: BigInt(SECONDS_IN_FOUR_YEARS),
  cachedNeuronStakeE8s: BigInt(E8S_PER_ICP),
  neuronFeesE8s: 0n,
  maturityE8sEquivalent: 0n,
  stakedMaturityE8sEquivalent: 0n,
  createdTimestampSeconds: 0n,
  dissolveState: { DissolveDelaySeconds: BigInt(NNS_MAXIMUM_DISSOLVE_DELAY) },
  hotKeys: [],
  followees: [],
  autoStakeMaturity: false,
  ...overrides,
});

// The voting-power fields are deliberately different on the two records so the tests can tell which
// one the decode read.
const listNeuronsResponse = (): ListNeuronsResponse => {
  const raw: RawNeuron = {
    id: [{ id: 123n }],
    account: new Array(32).fill(1),
    controller: [Principal.anonymous()],
    hot_keys: [Principal.anonymous()],
    cached_neuron_stake_e8s: 300_000_000n,
    neuron_fees_e8s: 0n,
    created_timestamp_seconds: 1_600_000_000n,
    aging_since_timestamp_seconds: 1_600_000_000n,
    dissolve_state: [{ DissolveDelaySeconds: BigInt(NNS_MAXIMUM_DISSOLVE_DELAY) }],
    followees: [[4, { followees: [{ id: 999n }] }]],
    maturity_e8s_equivalent: 0n,
    staked_maturity_e8s_equivalent: [],
    auto_stake_maturity: [true],
    voting_power_refreshed_timestamp_seconds: [1_700_000_000n],
    potential_voting_power: [900_000_000n],
    deciding_voting_power: [450_000_000n],
  };
  return {
    neuron_infos: [
      [
        123n,
        {
          state: NeuronState.Locked,
          age_seconds: BigInt(SECONDS_IN_FOUR_YEARS),
          dissolve_delay_seconds: BigInt(NNS_MAXIMUM_DISSOLVE_DELAY),
          voting_power_refreshed_timestamp_seconds: [1_700_000_001n],
          potential_voting_power: [900_000_001n],
          deciding_voting_power: [450_000_001n],
        },
      ],
    ],
    full_neurons: [raw],
  };
};

describe("toNeuronsData", () => {
  it("normalizes a list_neurons response into ICPNeurons", () => {
    const { fullNeurons } = toNeuronsData(listNeuronsResponse(), 42);
    expect(fullNeurons).toHaveLength(1);
    const [n] = fullNeurons;
    expect(n.id).toBe(123n);
    expect(n.state).toBe(NeuronState.Locked);
    expect(n.dissolveDelaySeconds).toBe(BigInt(NNS_MAXIMUM_DISSOLVE_DELAY));
    expect(n.ageSeconds).toBe(BigInt(SECONDS_IN_FOUR_YEARS));
    expect(n.controller).toBe("2vxsx-fae");
    expect(n.autoStakeMaturity).toBe(true);
    expect(n.followees).toEqual([{ topic: 4, followeeIds: [999n] }]);
    expect(n.accountIdentifier).toMatch(/^[0-9a-f]{64}$/);
  });

  it("prefers the NeuronInfo voting-power fields over the full neuron's", () => {
    const [n] = toNeuronsData(listNeuronsResponse()).fullNeurons;
    expect(n.votingPowerRefreshedTimestampSeconds).toBe(1_700_000_001n);
    expect(n.potentialVotingPower).toBe(900_000_001n);
    expect(n.decidingVotingPower).toBe(450_000_001n);
  });

  it("falls back to the full neuron when NeuronInfo omits them, and omits them when both do", () => {
    const response = listNeuronsResponse();
    response.neuron_infos[0][1].voting_power_refreshed_timestamp_seconds = [];
    response.neuron_infos[0][1].deciding_voting_power = [];
    response.full_neurons[0].deciding_voting_power = [];

    const [n] = toNeuronsData(response).fullNeurons;
    expect(n.votingPowerRefreshedTimestampSeconds).toBe(1_700_000_000n);
    expect("decidingVotingPower" in n).toBe(false);
  });
});

describe("bonus multipliers (Mission 70)", () => {
  it("bonusMultiplier is 1 at zero and 1+maxBonus at the cap", () => {
    expect(bonusMultiplier({ amount: 0n, amountForMaxBonus: 100, maxBonus: 2 })).toBe(1);
    expect(bonusMultiplier({ amount: 100n, amountForMaxBonus: 100, maxBonus: 2 })).toBe(3);
  });

  it("dissolve-delay bonus is quadratic: 1.5x at half the max delay, 3x at the cap", () => {
    expect(dissolveDelayMultiplier(BigInt(NNS_MAXIMUM_DISSOLVE_DELAY / 2))).toBeCloseTo(1.5);
    expect(dissolveDelayMultiplier(BigInt(NNS_MAXIMUM_DISSOLVE_DELAY))).toBe(3);
  });

  it("age bonus is linear up to +25% at four years", () => {
    expect(ageMultiplier(BigInt(SECONDS_IN_FOUR_YEARS))).toBe(1.25);
    expect(ageMultiplier(BigInt(SECONDS_IN_FOUR_YEARS * 2))).toBe(1.25);
  });
});

describe("neuronCanVote", () => {
  const withDelay = (seconds: number) =>
    neuronCanVote(baseNeuron({ dissolveDelaySeconds: BigInt(seconds) }));

  it("turns on exactly at the two-week threshold", () => {
    expect(withDelay(NNS_MINIMUM_DISSOLVE_DELAY_TO_VOTE - 1)).toBe(false);
    expect(withDelay(NNS_MINIMUM_DISSOLVE_DELAY_TO_VOTE)).toBe(true);
  });

  it("excludes the delay a freshly staked neuron gets by default", () => {
    expect(withDelay(SECONDS_IN_7_DAYS)).toBe(false);
  });
});

describe("neuronPotentialVotingPower", () => {
  it("applies the 3x dissolve and 1.25x age bonuses (1 ICP → 3.75 ICP of power)", () => {
    expect(neuronPotentialVotingPower(baseNeuron())).toBe(BigInt(3.75 * E8S_PER_ICP));
  });

  it("is zero below the vote-eligibility dissolve delay", () => {
    expect(
      neuronPotentialVotingPower(baseNeuron({ dissolveDelaySeconds: BigInt(SECONDS_IN_7_DAYS) })),
    ).toBe(0n);
  });

  // The canister's stake_e8s subtracts neuron_fees_e8s before applying the bonuses, so a neuron
  // penalised for a rejected proposal votes on less than its cached stake. Omitting the subtraction
  // overstated its power by the fee times the full bonus.
  it("subtracts the rejection fees a neuron has accrued (0.8 ICP → 3 ICP of power)", () => {
    expect(
      neuronPotentialVotingPower(baseNeuron({ neuronFeesE8s: BigInt(0.2 * E8S_PER_ICP) })),
    ).toBe(BigInt(3 * E8S_PER_ICP));
  });

  it("counts staked maturity toward the base, net of those fees (1.4 ICP → 5.25 ICP of power)", () => {
    expect(
      neuronPotentialVotingPower(
        baseNeuron({
          neuronFeesE8s: BigInt(0.1 * E8S_PER_ICP),
          stakedMaturityE8sEquivalent: BigInt(0.5 * E8S_PER_ICP),
        }),
      ),
    ).toBe(BigInt(5.25 * E8S_PER_ICP));
  });

  it("keeps bigint precision for a whale neuron with a fractional bonus (stake above 2^53 e8s)", () => {
    // 1e9 ICP, far above Number's 2^53 exact-integer limit. baseNeuron has max dissolve (3x) and a
    // full 4y age (1.25x) → 3.75x, exercising a fractional multiplier at scale.
    const stake = 100_000_000_000_000_000n;
    expect(
      neuronPotentialVotingPower(
        baseNeuron({ cachedNeuronStakeE8s: stake, stakedMaturityE8sEquivalent: 0n }),
      ),
    ).toBe((stake * 375n) / 100n);
  });
});

describe("state permissions & dissolve duration", () => {
  it("maps state to the allowed lifecycle action", () => {
    expect(getNeuronActionPermissions(baseNeuron({ state: NeuronState.Locked }))).toMatchObject({
      canStartDissolving: true,
    });
    expect(getNeuronActionPermissions(baseNeuron({ state: NeuronState.Dissolving }))).toMatchObject(
      {
        canStopDissolving: true,
      },
    );
    expect(getNeuronActionPermissions(baseNeuron({ state: NeuronState.Dissolved }))).toMatchObject({
      canDisburse: true,
    });
  });

  it("returns the fixed delay when locked and the countdown when dissolving", () => {
    expect(getNeuronDissolveDurationSeconds(baseNeuron())).toBe(BigInt(NNS_MAXIMUM_DISSOLVE_DELAY));

    const dissolving = baseNeuron({
      state: NeuronState.Dissolving,
      dissolveState: { WhenDissolvedTimestampSeconds: 2_000n },
    });
    expect(getNeuronDissolveDurationSeconds(dissolving, 500)).toBe(1_500n);
    // Past the dissolve timestamp clamps to zero.
    expect(getNeuronDissolveDurationSeconds(dissolving, 3_000)).toBe(0n);
  });
});

describe("stake & split", () => {
  it("neuronStake subtracts fees and never goes negative", () => {
    expect(neuronStake(baseNeuron({ cachedNeuronStakeE8s: 300n, neuronFeesE8s: 100n }))).toBe(200n);
    expect(neuronStake(baseNeuron({ cachedNeuronStakeE8s: 100n, neuronFeesE8s: 300n }))).toBe(0n);
  });

  it("a neuron can be split only when it can leave the minimum stake on both halves plus fee", () => {
    const fee = BigInt(ICP_FEES);
    expect(minNeuronSplittable(fee)).toBe(2n * BigInt(MIN_NEURON_STAKE) + fee);
    expect(
      neuronCanBeSplit(baseNeuron({ cachedNeuronStakeE8s: minNeuronSplittable(fee) }), fee),
    ).toBe(true);
    expect(
      neuronCanBeSplit(baseNeuron({ cachedNeuronStakeE8s: minNeuronSplittable(fee) - 1n }), fee),
    ).toBe(false);
  });

  it("split bounds leave the minimum stake on both neurons at the smallest splittable size", () => {
    const fee = BigInt(ICP_FEES);
    const neuron = baseNeuron({ cachedNeuronStakeE8s: minNeuronSplittable(fee) });
    // The only valid amount at exactly the minimum splittable stake.
    expect(minAllowedSplitAmount(fee)).toBe(BigInt(MIN_NEURON_STAKE) + fee);
    expect(maxAllowedSplitAmount(neuron)).toBe(BigInt(MIN_NEURON_STAKE) + fee);
  });

  it("maxAllowedSplitAmount clamps to zero below the minimum stake", () => {
    expect(maxAllowedSplitAmount(baseNeuron({ cachedNeuronStakeE8s: 1n }))).toBe(0n);
  });
});

describe("maturity", () => {
  it("can stake maturity only when there is some", () => {
    expect(hasEnoughMaturityToStake(baseNeuron({ maturityE8sEquivalent: 1n }))).toBe(true);
    expect(hasEnoughMaturityToStake(baseNeuron({ maturityE8sEquivalent: 0n }))).toBe(false);
  });

  // The canister rejects a spawn whose maturity would not clear the minimum stake after the
  // worst-case -5% modulation: `(maturity_to_spawn as f64 * (1 - 0.05)) as u64 < min_stake`.
  // These are the two integers either side of that boundary, so the wallet neither offers a spawn
  // the canister would reject nor hides one it would accept.
  it("matches the canister's worst-case modulation boundary exactly", () => {
    const boundary = 105_263_158n; // ceil(MIN_NEURON_STAKE / 0.95)
    expect(Math.floor(Number(boundary) * 0.95)).toBeGreaterThanOrEqual(MIN_NEURON_STAKE);
    expect(Math.floor(Number(boundary - 1n) * 0.95)).toBeLessThan(MIN_NEURON_STAKE);

    expect(isEnoughMaturityToSpawn(baseNeuron({ maturityE8sEquivalent: boundary }), 100)).toBe(
      true,
    );
    expect(isEnoughMaturityToSpawn(baseNeuron({ maturityE8sEquivalent: boundary - 1n }), 100)).toBe(
      false,
    );
  });

  it("applies the requested percentage before the eligibility check", () => {
    const twice = 210_526_316n;
    expect(isEnoughMaturityToSpawn(baseNeuron({ maturityE8sEquivalent: twice }), 50)).toBe(true);
    expect(isEnoughMaturityToSpawn(baseNeuron({ maturityE8sEquivalent: twice }), 49)).toBe(false);
  });
});

describe("periodic confirmation", () => {
  const REFRESHED = 1_700_000_000n;
  const decaying = (overrides: Partial<ICPNeuron> = {}) =>
    baseNeuron({ votingPowerRefreshedTimestampSeconds: REFRESHED, ...overrides });
  const decayStart = Number(REFRESHED) + NNS_START_REDUCING_VOTING_POWER_AFTER_SECONDS;
  const clearedAt = decayStart + NNS_CLEAR_FOLLOWING_AFTER_SECONDS;

  it("counts down to the moment following is cleared, clamping at zero", () => {
    expect(getSecondsTillVotingPowerExpires(decaying(), clearedAt - 60)).toBe(60);
    expect(getSecondsTillVotingPowerExpires(decaying(), clearedAt)).toBe(0);
    expect(getSecondsTillVotingPowerExpires(decaying(), clearedAt + 10_000)).toBe(0);
  });

  it("reports unknown, not expired, for a neuron persisted before the field was decoded", () => {
    expect(getSecondsTillVotingPowerExpires(baseNeuron(), clearedAt)).toBeUndefined();
    expect(votingPowerNeedsRefresh([baseNeuron()], clearedAt)).toBe(false);
  });

  it("flags a refresh only once the neuron has entered the decay window", () => {
    expect(votingPowerNeedsRefresh([decaying()], decayStart - 1)).toBe(false);
    expect(votingPowerNeedsRefresh([decaying()], decayStart)).toBe(true);
  });

  it("ignores neurons whose dissolve delay is too short to vote", () => {
    const ineligible = decaying({ dissolveDelaySeconds: BigInt(SECONDS_IN_7_DAYS) });
    expect(votingPowerNeedsRefresh([ineligible], clearedAt)).toBe(false);
  });

  describe("neuronDecidingVotingPower", () => {
    const POTENTIAL = BigInt(3.75 * E8S_PER_ICP);

    it("counts the full potential right up to the moment decay begins", () => {
      expect(neuronDecidingVotingPower(decaying(), Number(REFRESHED))).toBe(POTENTIAL);
      expect(neuronDecidingVotingPower(decaying(), decayStart)).toBe(POTENTIAL);
    });

    it("falls linearly across the decay window", () => {
      const quarter = NNS_CLEAR_FOLLOWING_AFTER_SECONDS / 4;
      expect(neuronDecidingVotingPower(decaying(), decayStart + quarter * 2)).toBe(POTENTIAL / 2n);
      expect(neuronDecidingVotingPower(decaying(), decayStart + quarter * 3)).toBe(POTENTIAL / 4n);
    });

    it("is zero from the moment following is cleared", () => {
      expect(neuronDecidingVotingPower(decaying(), clearedAt)).toBe(0n);
      expect(neuronDecidingVotingPower(decaying(), clearedAt + 10_000)).toBe(0n);
    });

    it("counts the full potential when the canister reported no refresh timestamp", () => {
      expect(neuronDecidingVotingPower(baseNeuron(), clearedAt)).toBe(POTENTIAL);
    });

    it("is zero for a neuron that cannot vote, however recently it was refreshed", () => {
      const ineligible = decaying({ dissolveDelaySeconds: BigInt(SECONDS_IN_7_DAYS) });
      expect(neuronDecidingVotingPower(ineligible, Number(REFRESHED))).toBe(0n);
    });
  });

  it("neuronsNeedSync fires on the threshold and never on an empty snapshot", () => {
    const stale = LAST_SYNC_THRESHOLD_IN_DAYS * SECONDS_IN_DAY * 1000;
    const data = (lastUpdated: number) => new NeuronsData([baseNeuron()], lastUpdated);
    expect(neuronsNeedSync(data(0), stale - 1)).toBe(false);
    expect(neuronsNeedSync(data(0), stale)).toBe(true);
    expect(neuronsNeedSync(new NeuronsData([], 0), stale)).toBe(false);
  });

  it("isDeviceControlledNeuron distinguishes the controller from a hot key", () => {
    const principal = "2vxsx-fae";
    expect(isDeviceControlledNeuron(baseNeuron({ controller: principal }), principal)).toBe(true);
    expect(
      isDeviceControlledNeuron(
        baseNeuron({ controller: "other", hotKeys: [principal] }),
        principal,
      ),
    ).toBe(false);
    expect(isDeviceControlledNeuron(baseNeuron(), principal)).toBe(false);
  });
});

describe("getBannerState", () => {
  const REFRESHED = 1_700_000_000n;
  const votingNeuron = (overrides: Partial<ICPNeuron> = {}) =>
    baseNeuron({
      votingPowerRefreshedTimestampSeconds: REFRESHED,
      followees: [{ topic: 4, followeeIds: [9n] }],
      ...overrides,
    });
  // Recent enough that neuronsNeedSync stays quiet, and before the decay window opens.
  const NOW_MS = Number(REFRESHED) * 1000;
  const state = (neurons: ICPNeuron[], canStake = true, nowMSecs = NOW_MS) =>
    getBannerState({ neurons: new NeuronsData(neurons, nowMSecs), canStake, nowMSecs });

  it("prompts to stake only when there are no neurons and the balance allows it", () => {
    expect(state([])).toBe("stakeICP");
    expect(state([], false)).toBe("none");
  });

  it("is quiet for a fully configured, freshly confirmed neuron", () => {
    expect(state([votingNeuron()])).toBe("none");
  });

  it("puts a stale snapshot ahead of everything judged from it", () => {
    const nowMSecs = NOW_MS + LAST_SYNC_THRESHOLD_IN_DAYS * SECONDS_IN_DAY * 1000;
    const neurons = new NeuronsData([votingNeuron({ followees: [] })], NOW_MS);
    expect(getBannerState({ neurons, canStake: true, nowMSecs })).toBe("syncNeurons");
  });

  it("ranks decaying voting power above configuration gaps", () => {
    const nowMSecs = (Number(REFRESHED) + NNS_START_REDUCING_VOTING_POWER_AFTER_SECONDS) * 1000;
    expect(state([votingNeuron({ followees: [] })], true, nowMSecs)).toBe("confirmFollowing");
  });

  it("asks to raise a dissolve delay that is too short to vote", () => {
    expect(state([votingNeuron({ dissolveDelaySeconds: BigInt(SECONDS_IN_7_DAYS) })])).toBe(
      "lockNeurons",
    );
  });

  it("asks for followees once the neuron can vote but follows nobody", () => {
    expect(state([votingNeuron({ followees: [] })])).toBe("addFollowees");
  });
});

describe("secondsToDuration", () => {
  it("splits a duration across the NNS year and month averages", () => {
    expect(secondsToDuration(SECONDS_IN_YEAR * 2)).toMatchObject({ years: 2, months: 0, days: 0 });
    expect(secondsToDuration(SECONDS_IN_MONTH + SECONDS_IN_DAY * 2 + 61)).toMatchObject({
      years: 0,
      months: 1,
      days: 2,
      hours: 0,
      minutes: 1,
      seconds: 1,
    });
  });

  it("clamps negatives to zero and keeps precision for bigint input", () => {
    expect(secondsToDuration(-5)).toMatchObject({ years: 0, seconds: 0 });
    expect(secondsToDuration(BigInt(SECONDS_IN_YEAR) * 1_000n)).toMatchObject({ years: 1_000 });
  });
});
