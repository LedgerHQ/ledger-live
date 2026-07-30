import type {
  StakingTransactionIntent,
  TransactionIntent,
} from "@ledgerhq/coin-module-framework/api/index";
import { BigNumber } from "bignumber.js";
import { getActionCosts, getGasPrice, getStakingPositions } from "../../network";
import { getCurrentNearPreloadData } from "../../preload-data";
import { estimateFees } from "./estimateFees";

jest.mock("../../network", () => ({
  getActionCosts: jest.fn(),
  getGasPrice: jest.fn(),
  getStakingPositions: jest.fn(),
}));

const GAS_PRICE = "100000000";

const COSTS = {
  storageCost: new BigNumber("10000000000000000000"),
  transferCostSend: new BigNumber(115123062500),
  transferCostExecution: new BigNumber(115123062500),
  receiptCreationSend: new BigNumber(108059500000),
  receiptCreationExecution: new BigNumber(108059500000),
  createAccountCostSend: new BigNumber(99607375000),
  createAccountCostExecution: new BigNumber(99607375000),
  addKeyCostSend: new BigNumber(101765125000),
  addKeyCostExecution: new BigNumber(101765125000),
};

/** exactOptionalPropertyTypes is on, so an explicit `undefined` override needs the union. */
type Overrides<T> = { [K in keyof T]?: T[K] | undefined };

const intent = (overrides: Overrides<TransactionIntent> = {}): TransactionIntent =>
  ({
    intentType: "transaction",
    type: "send",
    sender: "sender.near",
    recipient: "recipient.near",
    amount: 1_000_000_000_000_000_000_000_000n,
    asset: { type: "native" },
    ...overrides,
  }) as TransactionIntent;

describe("estimateFees", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getGasPrice as jest.Mock).mockResolvedValue(GAS_PRICE);
    (getActionCosts as unknown as jest.Mock).mockResolvedValue(COSTS);
  });

  it("returns a non-zero fee without any preload having run", async () => {
    // The account bridge fills these in via preload(); nothing does on this path, so the defaults
    // are zeros. A fee sourced from them would be zero and every transaction would fail on chain.
    expect(getCurrentNearPreloadData().gasPrice.isZero()).toBe(true);
    expect(getCurrentNearPreloadData().transferCostSend.isZero()).toBe(true);

    const { value } = await estimateFees(intent());

    expect(value).toBeGreaterThan(0n);
    expect(getActionCosts).toHaveBeenCalled();
  });

  it("charges more for an implicit recipient, which the transfer has to create", async () => {
    const named = await estimateFees(intent());
    const implicit = await estimateFees(
      intent({ recipient: "4e7de0a21d8a20f970c86b6edf407906d7ba9e205979c3268270eef80a286e2d" }),
    );

    expect(implicit.value).toBeGreaterThan(named.value);
  });

  it("reports the gas price it priced with", async () => {
    const { parameters } = await estimateFees(intent());

    expect(parameters).toEqual({ gasPrice: GAS_PRICE });
  });

  it("prices a staking intent from staking gas, not from transfer costs", async () => {
    const staking = (await estimateFees({
      ...intent(),
      intentType: "staking",
      type: "delegate",
      mode: "delegate",
      valAddress: "astro-stakers.poolv1.near",
    } as StakingTransactionIntent)) as { value: bigint };

    const send = await estimateFees(intent());

    expect(staking.value).toBeGreaterThan(0n);
    expect(staking.value).not.toBe(send.value);
  });

  it("returns a zero estimate for an incomplete form instead of throwing", async () => {
    const { value } = await estimateFees(intent({ recipient: "" }));

    expect(value).toBe(0n);
    expect(getGasPrice).not.toHaveBeenCalled();
  });

  it("returns a zero estimate for a staking intent with no validator picked yet", async () => {
    const { value } = await estimateFees({
      ...intent({ recipient: "" }),
      intentType: "staking",
      type: "stake",
    } as StakingTransactionIntent);

    expect(value).toBe(0n);
    expect(getGasPrice).not.toHaveBeenCalled();
  });

  it("reports the pool's released amount as the ceiling for a withdrawal", async () => {
    (getStakingPositions as jest.Mock).mockResolvedValue({
      stakingPositions: [
        {
          validatorId: "astro-stakers.poolv1.near",
          staked: new BigNumber(0),
          available: new BigNumber("200000000000000000000000"),
          pending: new BigNumber(0),
        },
      ],
    });

    const { parameters } = await estimateFees({
      ...intent({ recipient: "astro-stakers.poolv1.near" }),
      intentType: "staking",
      type: "finalize_unstake",
    } as unknown as StakingTransactionIntent);

    expect(parameters?.amount).toBe(200000000000000000000000n);
  });

  describe("with a caller-supplied gas price", () => {
    it("prices from the override instead of querying the network", async () => {
      const { value, parameters } = await estimateFees(intent(), { gasPrice: "200000000" });

      expect(getGasPrice).not.toHaveBeenCalled();
      expect(parameters).toEqual({ gasPrice: "200000000" });

      // Twice the live gas price, so twice the fee.
      const live = await estimateFees(intent());
      expect(value).toBe(live.value * 2n);
    });

    it("accepts the bigint the framework hands fee parameters back as", async () => {
      const { parameters } = await estimateFees(intent(), { gasPrice: 200_000_000n });

      expect(parameters).toEqual({ gasPrice: "200000000" });
      expect(getGasPrice).not.toHaveBeenCalled();
    });

    it.each([
      ["zero", 0],
      ["negative", -1],
      ["fractional", 1.5],
      ["not a number", "abc"],
      ["absent", undefined],
    ])("falls back to the live gas price when the override is %s", async (_label, gasPrice) => {
      await estimateFees(intent(), { gasPrice });

      expect(getGasPrice).toHaveBeenCalled();
    });
  });
});
