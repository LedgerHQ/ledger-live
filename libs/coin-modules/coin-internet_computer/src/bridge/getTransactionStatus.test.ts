import { Account } from "@ledgerhq/types-live";
import { validateAddress } from "../logic/validation";
import BigNumber from "bignumber.js";
import {
  ICP_FEES,
  MIN_NEURON_STAKE,
  NNS_MAXIMUM_DISSOLVE_DELAY,
  NNS_MINIMUM_DISSOLVE_DELAY,
} from "../consts";
import {
  ICPCreateNeuronWarning,
  ICPDissolveDelayGTMax,
  ICPDissolveDelayLTCurrent,
  ICPDissolveDelayLTMin,
  ICPHotKeyAlreadyExists,
  ICPHotKeyIsController,
  ICPInvalidDissolveDelayIncrease,
  ICPInvalidHotKey,
  ICPInvalidPercentage,
  ICPNeuronNotFound,
  ICPSplitNotAllowed,
  ICPStakeMemoNotRecoverable,
  InvalidMemoICP,
  NotEnoughTransferAmount,
} from "../errors";
import * as logicValidateMemo from "../logic/validateMemo";
import { ICPAccount, ICPNeuron, NeuronsData, NeuronState, Transaction } from "../types";
import { getTransactionStatus } from "./getTransactionStatus";

jest.mock("../logic/validation");
jest.mock("../logic/validateMemo");

describe("getTransactionStatus", () => {
  const spiedValidateMemo = logicValidateMemo.validateMemo as jest.Mock;
  const spiedValidateAddress = jest.mocked(validateAddress);

  beforeEach(() => {
    spiedValidateMemo.mockClear();
    spiedValidateAddress.mockClear();

    spiedValidateAddress.mockReturnValue({ isValid: true });
  });

  it("should not set error on transaction when memo is validated", async () => {
    spiedValidateMemo.mockReturnValueOnce(true);

    const account = { currency: { name: "Internet Computer" } } as Account;
    const transaction = {
      type: "send",
      amount: BigNumber(0),
      memo: "random memo for unit test",
    } as Transaction;
    const status = await getTransactionStatus(account, transaction);
    expect(status.errors.transaction).not.toBeDefined();

    expect(spiedValidateMemo).toHaveBeenCalledWith(transaction.memo);
  });

  it("should set error on transaction when memo is invalidated", async () => {
    spiedValidateMemo.mockReturnValueOnce(false);

    const account = { currency: { name: "Internet Computer" } } as Account;
    const transaction = {
      type: "send",
      amount: BigNumber(0),
      memo: "random memo for unit test",
    } as Transaction;
    const status = await getTransactionStatus(account, transaction);
    expect(status.errors.transaction).toBeInstanceOf(InvalidMemoICP);

    expect(spiedValidateMemo).toHaveBeenCalledWith(transaction.memo);
  });

  it("skips memo validation for governance ops (memo is not part of the call payload)", async () => {
    const account = {} as Account;
    const transaction = {
      type: "start_dissolving",
      neuronId: "123",
      amount: BigNumber(0),
      memo: "not a numeric memo",
    } as Transaction;
    const status = await getTransactionStatus(account, transaction);
    expect(status.errors.transaction).not.toBeInstanceOf(InvalidMemoICP);
    expect(spiedValidateMemo).not.toHaveBeenCalled();
  });

  describe("neuron operations", () => {
    const neuron = (over: Partial<ICPNeuron> = {}): ICPNeuron => ({
      id: 7n,
      accountIdentifier: "ab".repeat(32),
      state: NeuronState.Locked,
      dissolveDelaySeconds: BigInt(NNS_MINIMUM_DISSOLVE_DELAY),
      ageSeconds: 0n,
      cachedNeuronStakeE8s: 500_000_000n,
      neuronFeesE8s: 0n,
      maturityE8sEquivalent: 0n,
      stakedMaturityE8sEquivalent: 0n,
      createdTimestampSeconds: 0n,
      dissolveState: { DissolveDelaySeconds: BigInt(NNS_MINIMUM_DISSOLVE_DELAY) },
      hotKeys: [],
      followees: [],
      autoStakeMaturity: false,
      ...over,
    });

    const accountWith = (...neurons: ICPNeuron[]): ICPAccount =>
      ({
        currency: { name: "Internet Computer" },
        freshAddress: "senderaddress",
        freshAddressPath: "44'/223'/0'/0/0",
        balance: new BigNumber(1_000_000_000),
        spendableBalance: new BigNumber(1_000_000_000),
        neurons: new NeuronsData(neurons, 0),
      }) as unknown as ICPAccount;

    const tx = (over: Partial<Transaction>): Transaction =>
      ({ amount: new BigNumber(0), fees: new BigNumber(10000), ...over }) as Transaction;

    beforeEach(() => spiedValidateMemo.mockReturnValue(true));

    it("warns and rejects a create_neuron below the minimum stake", async () => {
      const status = await getTransactionStatus(
        accountWith(),
        tx({
          type: "create_neuron",
          recipient: "neuronsubaccount",
          amount: new BigNumber(MIN_NEURON_STAKE - 1),
        }),
      );
      expect(status.errors.amount).toBeInstanceOf(NotEnoughTransferAmount);
      expect(status.warnings.staking).toBeInstanceOf(ICPCreateNeuronWarning);
    });

    it("rejects a neuron operation when the neuron is unknown", async () => {
      const status = await getTransactionStatus(
        accountWith(),
        tx({
          type: "set_dissolve_delay",
          neuronId: "999",
          dissolveDelay: String(NNS_MINIMUM_DISSOLVE_DELAY),
        }),
      );
      expect(status.errors.transaction).toBeInstanceOf(ICPNeuronNotFound);
    });

    it("returns a structured error (not a throw) for a non-integer dissolve delay", async () => {
      const status = await getTransactionStatus(
        accountWith(neuron()),
        tx({ type: "set_dissolve_delay", neuronId: "7", dissolveDelay: "1.5" }),
      );
      expect(status.errors.transaction).toBeInstanceOf(ICPDissolveDelayLTMin);
    });

    it("rejects a dissolve delay above the network maximum", async () => {
      const status = await getTransactionStatus(
        accountWith(neuron()),
        tx({
          type: "set_dissolve_delay",
          neuronId: "7",
          dissolveDelay: String(NNS_MAXIMUM_DISSOLVE_DELAY + 1),
        }),
      );
      expect(status.errors.transaction).toBeInstanceOf(ICPDissolveDelayGTMax);
    });

    // Every surface that reports a bound does it in whole days, so the error carries the day count
    // alongside the seconds. The minimum rounds up and the maximum down, so both stay acceptable to
    // the canister — the two-year maximum is 730.5 days, which has to report as 730, not 731.
    it.each([
      ["1.5", { minSeconds: NNS_MINIMUM_DISSOLVE_DELAY, minDays: 7, count: 7 }],
      [
        String(NNS_MAXIMUM_DISSOLVE_DELAY + 1),
        { maxSeconds: NNS_MAXIMUM_DISSOLVE_DELAY, maxDays: 730, count: 730 },
      ],
    ])(
      "reports the offended bound in days as well as seconds (%s)",
      async (dissolveDelay, bound) => {
        const status = await getTransactionStatus(
          accountWith(neuron()),
          tx({ type: "set_dissolve_delay", neuronId: "7", dissolveDelay }),
        );
        expect(status.errors.transaction).toMatchObject(bound);
      },
    );

    // Reusing ICPDissolveDelayLTMin here quoted a bound the entry never crossed, and rounding its
    // one-second stand-in up to days put "at least 1 days" on screen.
    it.each(["0", "-5", "1.5", "", "abc"])(
      "names the entry rather than the network minimum for an increase of %s",
      async additionalDissolveDelay => {
        const status = await getTransactionStatus(
          accountWith(neuron()),
          tx({ type: "increase_dissolve_delay", neuronId: "7", additionalDissolveDelay }),
        );
        expect(status.errors.transaction).toBeInstanceOf(ICPInvalidDissolveDelayIncrease);
      },
    );

    it("rejects a dissolve delay below the neuron's current delay", async () => {
      const status = await getTransactionStatus(
        accountWith(
          neuron({ dissolveState: { DissolveDelaySeconds: BigInt(NNS_MAXIMUM_DISSOLVE_DELAY) } }),
        ),
        tx({
          type: "set_dissolve_delay",
          neuronId: "7",
          dissolveDelay: String(NNS_MINIMUM_DISSOLVE_DELAY),
        }),
      );
      expect(status.errors.transaction).toBeInstanceOf(ICPDissolveDelayLTCurrent);
    });

    it("rejects an invalid and an already-present hot key", async () => {
      const invalid = await getTransactionStatus(
        accountWith(neuron()),
        tx({ type: "add_hot_key", neuronId: "7", hotKeyToAdd: "not-a-principal" }),
      );
      expect(invalid.errors.transaction).toBeInstanceOf(ICPInvalidHotKey);

      const existing = await getTransactionStatus(
        accountWith(neuron({ hotKeys: ["2vxsx-fae"] })),
        tx({ type: "add_hot_key", neuronId: "7", hotKeyToAdd: "2vxsx-fae" }),
      );
      expect(existing.errors.transaction).toBeInstanceOf(ICPHotKeyAlreadyExists);

      const missing = await getTransactionStatus(
        accountWith(),
        tx({ type: "add_hot_key", neuronId: "7", hotKeyToAdd: "2vxsx-fae" }),
      );
      expect(missing.errors.transaction).toBeInstanceOf(ICPNeuronNotFound);
    });

    it("rejects the neuron's own controller as a hot key", async () => {
      const status = await getTransactionStatus(
        accountWith(neuron({ controller: "2vxsx-fae" })),
        tx({ type: "add_hot_key", neuronId: "7", hotKeyToAdd: "2vxsx-fae" }),
      );
      expect(status.errors.transaction).toBeInstanceOf(ICPHotKeyIsController);
    });

    it("rejects an out-of-range spawn percentage", async () => {
      const status = await getTransactionStatus(
        accountWith(neuron()),
        tx({ type: "spawn_neuron_from_maturity", neuronId: "7", percentageToSpawn: "150" }),
      );
      expect(status.errors.transaction).toBeInstanceOf(ICPInvalidPercentage);
    });

    it("rejects a non-integer stake-maturity percentage", async () => {
      const status = await getTransactionStatus(
        accountWith(neuron()),
        tx({ type: "stake_maturity", neuronId: "7", percentageToStake: "33.3" }),
      );
      expect(status.errors.transaction).toBeInstanceOf(ICPInvalidPercentage);
    });

    it("accepts a valid maturity percentage (and an absent one)", async () => {
      const valid = await getTransactionStatus(
        accountWith(neuron()),
        tx({ type: "stake_maturity", neuronId: "7", percentageToStake: "50" }),
      );
      expect(valid.errors.transaction).toBeUndefined();

      const absent = await getTransactionStatus(
        accountWith(neuron()),
        tx({ type: "stake_maturity", neuronId: "7" }),
      );
      expect(absent.errors.transaction).toBeUndefined();
    });

    it("rejects a numeric 0 percentage (0 is out of range, not 'absent')", async () => {
      const status = await getTransactionStatus(
        accountWith(neuron()),
        tx({ type: "stake_maturity", neuronId: "7", percentageToStake: 0 as unknown as string }),
      );
      expect(status.errors.transaction).toBeInstanceOf(ICPInvalidPercentage);
    });

    it("returns a structured error (never throws) for a non-finite split amount", async () => {
      const status = await getTransactionStatus(
        accountWith(neuron({ cachedNeuronStakeE8s: 1_000_000_000n })),
        tx({ type: "split_neuron", neuronId: "7", amount: new BigNumber(NaN) }),
      );
      expect(status.errors.amount).toBeInstanceOf(NotEnoughTransferAmount);
    });

    it("rejects a split when the neuron cannot leave the minimum stake on both halves", async () => {
      const status = await getTransactionStatus(
        accountWith(neuron({ cachedNeuronStakeE8s: BigInt(MIN_NEURON_STAKE) })),
        tx({ type: "split_neuron", neuronId: "7", amount: new BigNumber(MIN_NEURON_STAKE) }),
      );
      expect(status.errors.amount).toBeInstanceOf(ICPSplitNotAllowed);
    });

    it("enforces the split amount range MIN+fee <= amount <= stake-MIN", async () => {
      // 10 ICP stake, no fees → valid amount range [MIN+fee, stake-MIN].
      const at = (amount: number) =>
        getTransactionStatus(
          accountWith(neuron({ cachedNeuronStakeE8s: 1_000_000_000n })),
          tx({ type: "split_neuron", neuronId: "7", amount: new BigNumber(amount) }),
        );
      const min = MIN_NEURON_STAKE + ICP_FEES;
      const max = 1_000_000_000 - MIN_NEURON_STAKE;

      expect((await at(max)).errors.amount).toBeUndefined();
      expect((await at(max + 1)).errors.amount).toBeInstanceOf(ICPSplitNotAllowed);
      expect((await at(min)).errors.amount).toBeUndefined();
      expect((await at(min - 1)).errors.amount).toBeInstanceOf(NotEnoughTransferAmount);
    });

    it("rejects an increase_stake whose stake nonce is not recoverable (no memo)", async () => {
      const status = await getTransactionStatus(
        accountWith(),
        tx({ type: "increase_stake", recipient: "cd".repeat(32), amount: new BigNumber(1000) }),
      );
      expect(status.errors.transaction).toBeInstanceOf(ICPStakeMemoNotRecoverable);
    });

    it("accepts an increase_stake once the recovered nonce is present", async () => {
      const status = await getTransactionStatus(
        accountWith(),
        tx({
          type: "increase_stake",
          recipient: "cd".repeat(32),
          amount: new BigNumber(1000),
          stakeNonce: "42",
        }),
      );
      expect(status.errors.transaction).not.toBeInstanceOf(ICPStakeMemoNotRecoverable);
    });

    it("rejects a governance op with no neuronId", async () => {
      const status = await getTransactionStatus(accountWith(), tx({ type: "start_dissolving" }));
      expect(status.errors.transaction).toBeInstanceOf(ICPNeuronNotFound);
    });

    it("charges no ledger fee for a governance operation", async () => {
      const status = await getTransactionStatus(
        accountWith(neuron()),
        tx({ type: "start_dissolving", neuronId: "7" }),
      );
      expect(status.estimatedFees.toString()).toBe("0");
      expect(status.errors).toEqual({});
    });
  });
});
