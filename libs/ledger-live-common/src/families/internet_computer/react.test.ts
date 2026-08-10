/**
 * @jest-environment jsdom
 */
import BigNumber from "bignumber.js";
import { renderHook } from "@testing-library/react";
import { ICP_FEES, MIN_NEURON_STAKE } from "./consts";
import { NeuronsData, NeuronState } from "./types";
import type { ICPAccount, ICPNeuron } from "./types";
import {
  canStakeICP,
  getNeuronState,
  useICPNeuronById,
  useICPNeurons,
  useTotalMaturity,
  useTotalStaked,
  useTotalStakedMaturity,
} from "./react";
import type { ICPNeuronStateLabel } from "./react";

const MIN_STAKE_WITH_FEE = MIN_NEURON_STAKE + ICP_FEES;

const makeNeuron = (overrides: Partial<ICPNeuron> = {}): ICPNeuron => ({
  accountIdentifier: "ab".repeat(32),
  state: NeuronState.Locked,
  dissolveDelaySeconds: 0n,
  ageSeconds: 0n,
  cachedNeuronStakeE8s: 0n,
  neuronFeesE8s: 0n,
  maturityE8sEquivalent: 0n,
  stakedMaturityE8sEquivalent: 0n,
  createdTimestampSeconds: 0n,
  hotKeys: [],
  followees: [],
  autoStakeMaturity: false,
  ...overrides,
});

const makeICPAccount = (neurons: NeuronsData, spendableBalance: number | string = 0): ICPAccount =>
  ({
    type: "Account",
    currency: { family: "internet_computer" },
    balance: new BigNumber(spendableBalance),
    spendableBalance: new BigNumber(spendableBalance),
    neurons,
  }) as unknown as ICPAccount;

describe("useICPNeurons", () => {
  it("returns the neurons stored on the account", () => {
    const neurons = [makeNeuron({ id: 1n }), makeNeuron({ id: 2n })];
    const account = makeICPAccount(new NeuronsData(neurons, 1));
    const { result } = renderHook(() => useICPNeurons(account));
    expect(result.current).toBe(neurons);
  });

  it("returns an empty list when the account carries no neurons snapshot", () => {
    const account = makeICPAccount(NeuronsData.empty());
    const { result } = renderHook(() => useICPNeurons(account));
    expect(result.current).toEqual([]);
  });

  it("returns an empty list when neurons is absent from the account", () => {
    const account = { spendableBalance: new BigNumber(0) } as unknown as ICPAccount;
    const { result } = renderHook(() => useICPNeurons(account));
    expect(result.current).toEqual([]);
  });

  it("returns the same reference for two accounts that both carry no neurons", () => {
    const { result: a } = renderHook(() => useICPNeurons(makeICPAccount(NeuronsData.empty())));
    const { result: b } = renderHook(() => useICPNeurons(makeICPAccount(NeuronsData.empty())));
    expect(a.current).toBe(b.current);
  });

  it("keeps the same reference when the account object changes but the snapshot does not", () => {
    const snapshot = new NeuronsData([makeNeuron({ id: 1n })], 1);
    const { result, rerender } = renderHook(
      ({ account }: { account: ICPAccount }) => useICPNeurons(account),
      { initialProps: { account: makeICPAccount(snapshot) } },
    );
    const first = result.current;
    rerender({ account: makeICPAccount(snapshot, 42) });
    expect(result.current).toBe(first);
  });
});

describe("useICPNeuronById", () => {
  const neurons = new NeuronsData([makeNeuron({ id: 7n }), makeNeuron({ id: 8n })], 1);

  it("returns the neuron whose id matches", () => {
    const account = makeICPAccount(neurons);
    const { result } = renderHook(() => useICPNeuronById(account, "8"));
    expect(result.current?.id).toBe(8n);
  });

  it("returns undefined when no neuron matches", () => {
    const account = makeICPAccount(neurons);
    const { result } = renderHook(() => useICPNeuronById(account, "99"));
    expect(result.current).toBeUndefined();
  });

  it("returns undefined when the account carries no neurons", () => {
    const account = makeICPAccount(NeuronsData.empty());
    const { result } = renderHook(() => useICPNeuronById(account, "7"));
    expect(result.current).toBeUndefined();
  });

  it("ignores neurons whose id was not returned by the canister", () => {
    const account = makeICPAccount(new NeuronsData([makeNeuron()], 1));
    const { result } = renderHook(() => useICPNeuronById(account, "undefined"));
    expect(result.current).toBeUndefined();
  });
});

describe("canStakeICP", () => {
  it("allows staking when the spendable balance covers the minimum stake plus the fee", () => {
    expect(canStakeICP(makeICPAccount(NeuronsData.empty(), MIN_STAKE_WITH_FEE))).toBe(true);
  });

  it("rejects staking one unit below the minimum stake plus the fee", () => {
    expect(canStakeICP(makeICPAccount(NeuronsData.empty(), MIN_STAKE_WITH_FEE - 1))).toBe(false);
  });

  it("allows staking above the minimum stake plus the fee", () => {
    expect(canStakeICP(makeICPAccount(NeuronsData.empty(), MIN_STAKE_WITH_FEE + 1))).toBe(true);
  });

  it("rejects staking when the minimum stake is covered but the fee is not", () => {
    expect(canStakeICP(makeICPAccount(NeuronsData.empty(), MIN_NEURON_STAKE))).toBe(false);
  });

  it("rejects staking on an empty account", () => {
    expect(canStakeICP(makeICPAccount(NeuronsData.empty()))).toBe(false);
  });
});

describe("getNeuronState", () => {
  it.each<[NeuronState, ICPNeuronStateLabel]>([
    [NeuronState.Locked, "Locked"],
    [NeuronState.Dissolving, "Dissolving"],
    [NeuronState.Dissolved, "Dissolved"],
    [NeuronState.Spawning, "Spawning"],
    [NeuronState.Unspecified, "Unknown"],
  ])("maps state %s to %s", (state, expected) => {
    expect(getNeuronState(makeNeuron({ state }))).toBe(expected);
  });

  it("falls back to Unknown for a state outside the known enum", () => {
    expect(getNeuronState(makeNeuron({ state: 99 as NeuronState }))).toBe("Unknown");
  });
});

describe("useTotalStaked", () => {
  it("sums the stake of every neuron", () => {
    const account = makeICPAccount(
      new NeuronsData(
        [
          makeNeuron({ id: 1n, cachedNeuronStakeE8s: 300_000_000n }),
          makeNeuron({ id: 2n, cachedNeuronStakeE8s: 150_000_000n }),
        ],
        1,
      ),
    );
    const { result } = renderHook(() => useTotalStaked(account));
    expect(result.current).toEqual(new BigNumber(450_000_000));
  });

  it("subtracts accrued neuron fees from the stake", () => {
    const account = makeICPAccount(
      new NeuronsData(
        [
          makeNeuron({ id: 1n, cachedNeuronStakeE8s: 300_000_000n, neuronFeesE8s: 20_000_000n }),
          makeNeuron({ id: 2n, cachedNeuronStakeE8s: 100_000_000n }),
        ],
        1,
      ),
    );
    const { result } = renderHook(() => useTotalStaked(account));
    expect(result.current).toEqual(new BigNumber(380_000_000));
  });

  it("clamps a neuron whose fees exceed its stake to zero", () => {
    const account = makeICPAccount(
      new NeuronsData([makeNeuron({ id: 1n, cachedNeuronStakeE8s: 10n, neuronFeesE8s: 500n })], 1),
    );
    const { result } = renderHook(() => useTotalStaked(account));
    expect(result.current).toEqual(new BigNumber(0));
  });

  it("excludes maturity that has already been staked into the neuron", () => {
    const account = makeICPAccount(
      new NeuronsData(
        [
          makeNeuron({
            id: 1n,
            cachedNeuronStakeE8s: 100_000_000n,
            stakedMaturityE8sEquivalent: 90_000_000n,
          }),
        ],
        1,
      ),
    );
    const { result } = renderHook(() => useTotalStaked(account));
    expect(result.current).toEqual(new BigNumber(100_000_000));
  });

  it("returns zero when the account has no neurons", () => {
    const { result } = renderHook(() => useTotalStaked(makeICPAccount(NeuronsData.empty())));
    expect(result.current).toEqual(new BigNumber(0));
  });

  it("keeps full precision above Number.MAX_SAFE_INTEGER", () => {
    const account = makeICPAccount(
      new NeuronsData([makeNeuron({ id: 1n, cachedNeuronStakeE8s: 9_007_199_254_740_993n })], 1),
    );
    const { result } = renderHook(() => useTotalStaked(account));
    expect(result.current.toFixed()).toBe("9007199254740993");
  });

  it("returns the same instance while the neurons snapshot is unchanged", () => {
    const snapshot = new NeuronsData([makeNeuron({ id: 1n, cachedNeuronStakeE8s: 5n })], 1);
    const { result, rerender } = renderHook(
      ({ account }: { account: ICPAccount }) => useTotalStaked(account),
      { initialProps: { account: makeICPAccount(snapshot) } },
    );
    const first = result.current;
    rerender({ account: makeICPAccount(snapshot, 42) });
    expect(result.current).toBe(first);
  });
});

describe("useTotalMaturity", () => {
  it("sums the maturity of every neuron", () => {
    const account = makeICPAccount(
      new NeuronsData(
        [
          makeNeuron({ id: 1n, maturityE8sEquivalent: 40_000_000n }),
          makeNeuron({ id: 2n, maturityE8sEquivalent: 2_500_000n }),
        ],
        1,
      ),
    );
    const { result } = renderHook(() => useTotalMaturity(account));
    expect(result.current).toEqual(new BigNumber(42_500_000));
  });

  it("excludes maturity that has already been staked into the neuron", () => {
    const account = makeICPAccount(
      new NeuronsData(
        [
          makeNeuron({
            id: 1n,
            maturityE8sEquivalent: 10_000_000n,
            stakedMaturityE8sEquivalent: 90_000_000n,
          }),
        ],
        1,
      ),
    );
    const { result } = renderHook(() => useTotalMaturity(account));
    expect(result.current).toEqual(new BigNumber(10_000_000));
  });

  it("is unaffected by accrued neuron fees", () => {
    const account = makeICPAccount(
      new NeuronsData(
        [makeNeuron({ id: 1n, maturityE8sEquivalent: 7n, neuronFeesE8s: 500_000n })],
        1,
      ),
    );
    const { result } = renderHook(() => useTotalMaturity(account));
    expect(result.current).toEqual(new BigNumber(7));
  });

  it("returns zero when the account has no neurons", () => {
    const { result } = renderHook(() => useTotalMaturity(makeICPAccount(NeuronsData.empty())));
    expect(result.current).toEqual(new BigNumber(0));
  });
});

describe("useTotalStakedMaturity", () => {
  it("sums the staked maturity of every neuron", () => {
    const account = makeICPAccount(
      new NeuronsData(
        [
          makeNeuron({ id: 1n, stakedMaturityE8sEquivalent: 60_000_000n }),
          makeNeuron({ id: 2n, stakedMaturityE8sEquivalent: 5_000_000n }),
        ],
        1,
      ),
    );
    const { result } = renderHook(() => useTotalStakedMaturity(account));
    expect(result.current).toEqual(new BigNumber(65_000_000));
  });

  it("excludes maturity that has not been staked", () => {
    const account = makeICPAccount(
      new NeuronsData(
        [
          makeNeuron({
            id: 1n,
            maturityE8sEquivalent: 70_000_000n,
            stakedMaturityE8sEquivalent: 3_000_000n,
          }),
        ],
        1,
      ),
    );
    const { result } = renderHook(() => useTotalStakedMaturity(account));
    expect(result.current).toEqual(new BigNumber(3_000_000));
  });

  it("returns zero when the account has no neurons", () => {
    const { result } = renderHook(() =>
      useTotalStakedMaturity(makeICPAccount(NeuronsData.empty())),
    );
    expect(result.current).toEqual(new BigNumber(0));
  });
});
