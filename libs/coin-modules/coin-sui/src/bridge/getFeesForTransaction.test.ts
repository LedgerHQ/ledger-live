import { BigNumber } from "bignumber.js";
import { createFixtureAccount, createFixtureTransaction } from "../types/bridge.fixture";
import coinConfig from "../config";
import getEstimatedFees from "./getFeesForTransaction";
import { FIGMENT_SUI_VALIDATOR_ADDRESS, SUI_DUMMY_ADDRESS } from "../constants";

const estimateFees = jest.fn();

jest.mock("../logic", () => {
  return {
    estimateFees: (config: any, arg: any) => estimateFees(config, arg),
  };
});

describe("getEstimatedFees", () => {
  const transaction = createFixtureTransaction();

  beforeEach(() => {
    estimateFees.mockClear();
    coinConfig.setCoinConfig(() => ({}) as never);
  });

  it("returns fees estimation by sui sdk", async () => {
    // GIVEN
    const account = createFixtureAccount();
    const gasBudget = BigInt("3976000");
    const fees = BigInt("850000");
    estimateFees.mockResolvedValue({ fees, gasBudget });

    // WHEN
    const result = await getEstimatedFees({
      account,
      transaction,
    });

    // THEN
    expect(estimateFees).toHaveBeenCalledTimes(1);
    expect(estimateFees.mock.lastCall).not.toBeNull();
    expect(result.fees.toString()).toEqual(fees.toString());
    expect(result.gasBudget.toString()).toEqual(gasBudget.toString());
  });

  it("forwards stakedSuiId and useAllAmount when mode is undelegate", async () => {
    // GIVEN
    const account = createFixtureAccount();
    const stakedSuiId = "0xa5581752d1f6c436bb902641ee080450f2fa42bd2ef3f3cae262824cb3703fa6";
    const undelegateTransaction = createFixtureTransaction({
      mode: "undelegate" as const,
      stakedSuiId,
      useAllAmount: true,
      amount: BigNumber(1000000000),
    });
    estimateFees.mockResolvedValue({ fees: BigInt("3976000"), gasBudget: BigInt("3976000") });

    // WHEN
    await getEstimatedFees({ account, transaction: undelegateTransaction });

    // THEN
    expect(estimateFees).toHaveBeenCalledTimes(1);
    expect(estimateFees.mock.lastCall[1]).toMatchObject({
      type: "undelegate",
      intentType: "staking",
      stakedSuiId,
      useAllAmount: true,
    });
  });

  it("omits stakedSuiId from the call when undefined (does not coerce to empty string)", async () => {
    // GIVEN
    const account = createFixtureAccount();
    const sendTransaction = createFixtureTransaction(); // mode: "send", no stakedSuiId
    estimateFees.mockResolvedValue({ fees: BigInt("3976000"), gasBudget: BigInt("3976000") });

    // WHEN
    await getEstimatedFees({ account, transaction: sendTransaction });

    // THEN
    const args = estimateFees.mock.lastCall[1];
    expect("stakedSuiId" in args).toBe(false);
  });

  // A stake names its validator in `recipient`, so estimating against the placeholder simulated a
  // stake to a non-validator: on any transport that surfaces simulation failures, delegate fee
  // estimation could never succeed.
  it("estimates a delegation against the real validator, not the placeholder", async () => {
    const account = createFixtureAccount();
    estimateFees.mockResolvedValue({ fees: BigInt("850000"), gasBudget: BigInt("3976000") });
    const validator = FIGMENT_SUI_VALIDATOR_ADDRESS;

    await getEstimatedFees({
      account,
      transaction: createFixtureTransaction({ mode: "delegate", recipient: validator }),
    });

    expect(estimateFees.mock.lastCall?.[1].recipient).toEqual(validator);
  });

  it("falls back to the placeholder when a delegation has no validator yet", async () => {
    const account = createFixtureAccount();
    estimateFees.mockResolvedValue({ fees: BigInt("850000"), gasBudget: BigInt("3976000") });

    await getEstimatedFees({
      account,
      transaction: createFixtureTransaction({ mode: "delegate", recipient: "" }),
    });

    expect(estimateFees.mock.lastCall?.[1].recipient).toEqual(SUI_DUMMY_ADDRESS);
  });

  // `send` keeps the placeholder: estimation runs while the user is still typing an address.
  it("estimates a send against the placeholder recipient", async () => {
    const account = createFixtureAccount();
    estimateFees.mockResolvedValue({ fees: BigInt("850000"), gasBudget: BigInt("3976000") });

    await getEstimatedFees({
      account,
      transaction: createFixtureTransaction({ mode: "send" }),
    });

    expect(estimateFees.mock.lastCall?.[1].recipient).toEqual(SUI_DUMMY_ADDRESS);
  });
});
