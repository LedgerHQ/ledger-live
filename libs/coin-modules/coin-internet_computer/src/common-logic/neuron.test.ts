import { Principal } from "@dfinity/principal";
import {
  E8S_PER_ICP,
  ICP_FEES,
  MIN_NEURON_STAKE,
  NNS_MAXIMUM_DISSOLVE_DELAY,
  SECONDS_IN_FOUR_YEARS,
  SECONDS_IN_7_DAYS,
} from "../consts";
import { ICPNeuron, ListNeuronsResponse, NeuronState, RawNeuron } from "../types/neuron";
import {
  ageMultiplier,
  bonusMultiplier,
  dissolveDelayMultiplier,
  getNeuronActionPermissions,
  getNeuronDissolveDurationSeconds,
  minNeuronSplittable,
  neuronCanBeSplit,
  neuronPotentialVotingPower,
  neuronStake,
  toNeuronsData,
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

describe("toNeuronsData", () => {
  it("normalizes a list_neurons response into ICPNeurons", () => {
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
    };
    const response: ListNeuronsResponse = {
      neuron_infos: [
        [
          123n,
          {
            state: NeuronState.Locked,
            age_seconds: BigInt(SECONDS_IN_FOUR_YEARS),
            dissolve_delay_seconds: BigInt(NNS_MAXIMUM_DISSOLVE_DELAY),
          },
        ],
      ],
      full_neurons: [raw],
    };

    const { fullNeurons } = toNeuronsData(response, 42);
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

describe("neuronPotentialVotingPower", () => {
  it("applies the 3x dissolve and 1.25x age bonuses (1 ICP → 3.75 ICP of power)", () => {
    expect(neuronPotentialVotingPower(baseNeuron())).toBe(BigInt(3.75 * E8S_PER_ICP));
  });

  it("is zero below the vote-eligibility dissolve delay", () => {
    expect(
      neuronPotentialVotingPower(baseNeuron({ dissolveDelaySeconds: BigInt(SECONDS_IN_7_DAYS) })),
    ).toBe(0n);
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
});
