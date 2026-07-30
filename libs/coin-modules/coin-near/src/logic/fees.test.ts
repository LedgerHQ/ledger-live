import { BigNumber } from "bignumber.js";
import { STAKING_GAS_BASE } from "../constants";
import { computeFees, type NearFeeCosts } from "./fees";

const GAS_PRICE = new BigNumber(100_000_000);

const costs: NearFeeCosts = {
  transferCostSend: new BigNumber(100),
  transferCostExecution: new BigNumber(200),
  receiptCreationSend: new BigNumber(10),
  receiptCreationExecution: new BigNumber(20),
  createAccountCostSend: new BigNumber(1_000),
  createAccountCostExecution: new BigNumber(2_000),
  addKeyCostSend: new BigNumber(500),
  addKeyCostExecution: new BigNumber(700),
};

const NAMED_RECIPIENT = "recipient.near";
const IMPLICIT_RECIPIENT = "4e7de0a21d8a20f970c86b6edf407906d7ba9e205979c3268270eef80a286e2d";

describe("computeFees", () => {
  it("charges send + execution gas for a transfer to an existing named account", () => {
    const fees = computeFees({
      mode: "send",
      recipient: NAMED_RECIPIENT,
      gasPrice: GAS_PRICE,
      costs,
    });

    // (100 + 10 + 200 + 20) * gasPrice
    expect(fees.toFixed()).toBe(new BigNumber(330).multipliedBy(GAS_PRICE).toFixed());
  });

  it("adds account-creation and access-key gas for an implicit recipient", () => {
    const fees = computeFees({
      mode: "send",
      recipient: IMPLICIT_RECIPIENT,
      gasPrice: GAS_PRICE,
      costs,
    });

    // 330 + createAccount (1000 + 2000) + addKey (500 + 700)
    expect(fees.toFixed()).toBe(new BigNumber(4530).multipliedBy(GAS_PRICE).toFixed());
  });

  it.each(["stake", "unstake", "withdraw"])("prices %s from staking gas", mode => {
    const fees = computeFees({
      mode,
      recipient: "pool.poolv1.near",
      gasPrice: GAS_PRICE,
      costs,
    });

    // (5 * base + base buffer) * gasPrice / 10
    const expected = new BigNumber(STAKING_GAS_BASE)
      .multipliedBy(6)
      .multipliedBy(GAS_PRICE)
      .dividedBy(10);
    expect(fees.toFixed()).toBe(expected.toFixed());
  });

  it("uses the higher gas multiplier for a withdraw-all", () => {
    const fees = computeFees({
      mode: "withdraw",
      recipient: "pool.poolv1.near",
      useAllAmount: true,
      gasPrice: GAS_PRICE,
      costs,
    });

    // (7 * base + base buffer) * gasPrice / 10
    const expected = new BigNumber(STAKING_GAS_BASE)
      .multipliedBy(8)
      .multipliedBy(GAS_PRICE)
      .dividedBy(10);
    expect(fees.toFixed()).toBe(expected.toFixed());
  });

  it("does not treat a staking recipient as an implicit account", () => {
    const staking = computeFees({
      mode: "stake",
      recipient: IMPLICIT_RECIPIENT,
      gasPrice: GAS_PRICE,
      costs,
    });
    const send = computeFees({
      mode: "send",
      recipient: IMPLICIT_RECIPIENT,
      gasPrice: GAS_PRICE,
      costs,
    });

    expect(staking.eq(send)).toBe(false);
  });
});
