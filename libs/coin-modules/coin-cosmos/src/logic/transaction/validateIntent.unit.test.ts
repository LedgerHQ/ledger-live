import { Balance, TransactionIntent } from "@ledgerhq/coin-module-framework/api/index";

jest.mock("../validateAddress", () => ({
  validateAddress: jest.fn(),
}));
import { validateAddress } from "../validateAddress";
import { validateIntent } from "./validateIntent";
const mockedValidateAddress = validateAddress as jest.Mock;

const balances: Balance[] = [{ value: 10_000_000n, asset: { type: "native" } }];
const fees = { value: 5000n };
const base = {
  intentType: "transaction",
  type: "send",
  sender: "cosmos1sender",
  recipient: "cosmos1recipient",
  amount: 1_000_000n,
  asset: { type: "native" },
} as unknown as TransactionIntent;

const withOverrides = (o: Record<string, unknown>) =>
  ({ ...base, ...o }) as unknown as TransactionIntent;

describe("logic/transaction/validateIntent", () => {
  beforeEach(() => mockedValidateAddress.mockResolvedValue(true));

  it("accepts a valid send within balance", async () => {
    const res = await validateIntent("cosmos", base, balances, fees);
    expect(res.errors).toEqual({});
    expect(res.amount).toBe(1_000_000n);
    expect(res.estimatedFees).toBe(5000n);
    expect(res.totalSpent).toBe(1_005_000n);
  });

  it("flags a missing recipient", async () => {
    const res = await validateIntent("cosmos", withOverrides({ recipient: "" }), balances, fees);
    expect(res.errors.recipient).toBeInstanceOf(Error);
  });

  it("flags recipient equal to sender", async () => {
    const res = await validateIntent(
      "cosmos",
      withOverrides({ recipient: base.sender }),
      balances,
      fees,
    );
    expect(res.errors.recipient?.name).toBe("InvalidAddressBecauseDestinationIsAlsoSource");
  });

  it("flags an invalid recipient address", async () => {
    mockedValidateAddress.mockResolvedValue(false);
    const res = await validateIntent("cosmos", base, balances, fees);
    expect(res.errors.recipient).toBeInstanceOf(Error);
  });

  it("flags a zero amount", async () => {
    const res = await validateIntent("cosmos", withOverrides({ amount: 0n }), balances, fees);
    expect(res.errors.amount).toBeInstanceOf(Error);
  });

  it("flags insufficient balance", async () => {
    const res = await validateIntent(
      "cosmos",
      withOverrides({ amount: 20_000_000n }),
      balances,
      fees,
    );
    expect(res.errors.amount).toBeInstanceOf(Error);
  });

  it("accepts a delegate staking intent within balance", async () => {
    const intent = {
      intentType: "staking",
      type: "delegate",
      mode: "delegate",
      sender: "cosmos1sender",
      recipient: "",
      amount: 1_000_000n,
      valAddress: "cosmosvaloper1v",
      asset: { type: "native" },
    } as unknown as TransactionIntent;

    const res = await validateIntent("cosmos", intent, balances, fees);
    expect(res.errors).toEqual({});
    expect(res.amount).toBe(1_000_000n);
    expect(res.totalSpent).toBe(1_005_000n);
  });

  it("flags a delegate staking intent with zero amount", async () => {
    const intent = {
      intentType: "staking",
      type: "delegate",
      mode: "delegate",
      sender: "cosmos1sender",
      recipient: "",
      amount: 0n,
      valAddress: "cosmosvaloper1v",
      asset: { type: "native" },
    } as unknown as TransactionIntent;

    const res = await validateIntent("cosmos", intent, balances, fees);
    expect(res.errors.amount?.name).toBe("AmountRequired");
  });

  it("flags a compoundReward staking intent with zero amount", async () => {
    const intent = {
      intentType: "staking",
      type: "compoundReward",
      mode: "compoundReward",
      sender: "cosmos1sender",
      recipient: "",
      amount: 0n,
      valAddress: "cosmosvaloper1v",
      asset: { type: "native" },
    } as unknown as TransactionIntent;

    const res = await validateIntent("cosmos", intent, balances, fees);
    expect(res.errors.amount?.name).toBe("AmountRequired");
  });

  it("flags a staking intent missing the validator address", async () => {
    const intent = {
      intentType: "staking",
      type: "delegate",
      mode: "delegate",
      sender: "cosmos1sender",
      recipient: "",
      amount: 1_000_000n,
      valAddress: "",
      asset: { type: "native" },
    } as unknown as TransactionIntent;

    const res = await validateIntent("cosmos", intent, balances, fees);
    expect(res.errors.valAddress).toBeInstanceOf(Error);
  });

  it("flags a redelegate staking intent missing the destination validator", async () => {
    const intent = {
      intentType: "staking",
      type: "redelegate",
      mode: "redelegate",
      sender: "cosmos1sender",
      recipient: "",
      amount: 1_000_000n,
      valAddress: "cosmosvaloper1src",
      dstValAddress: "",
      asset: { type: "native" },
    } as unknown as TransactionIntent;

    const res = await validateIntent("cosmos", intent, balances, fees);
    expect(res.errors.dstValAddress).toBeInstanceOf(Error);
  });

  it("flags a staking intent whose validator address lacks the valoper prefix", async () => {
    const intent = {
      intentType: "staking",
      type: "delegate",
      mode: "delegate",
      sender: "cosmos1sender",
      recipient: "",
      amount: 1_000_000n,
      valAddress: "cosmos1notavaloper",
      asset: { type: "native" },
    } as unknown as TransactionIntent;

    const res = await validateIntent("cosmos", intent, balances, fees);
    expect(res.errors.valAddress?.name).toBe("InvalidAddress");
  });

  it("flags a validator address that merely contains the valoper prefix but doesn't start with it", async () => {
    const intent = {
      intentType: "staking",
      type: "delegate",
      mode: "delegate",
      sender: "cosmos1sender",
      recipient: "",
      amount: 1_000_000n,
      valAddress: "xcosmosvaloper1v",
      asset: { type: "native" },
    } as unknown as TransactionIntent;

    const res = await validateIntent("cosmos", intent, balances, fees);
    expect(res.errors.valAddress?.name).toBe("InvalidAddress");
  });

  it("flags a redelegate whose destination validator lacks the valoper prefix", async () => {
    const intent = {
      intentType: "staking",
      type: "redelegate",
      mode: "redelegate",
      sender: "cosmos1sender",
      recipient: "",
      amount: 1_000_000n,
      valAddress: "cosmosvaloper1src",
      dstValAddress: "cosmos1notavaloper",
      asset: { type: "native" },
    } as unknown as TransactionIntent;

    const res = await validateIntent("cosmos", intent, balances, fees);
    expect(res.errors.dstValAddress?.name).toBe("InvalidAddress");
  });

  it("warns when a compoundReward fee exceeds the reward being claimed", async () => {
    const intent = {
      intentType: "staking",
      type: "compoundReward",
      mode: "compoundReward",
      sender: "cosmos1sender",
      recipient: "",
      amount: 1_000n,
      valAddress: "cosmosvaloper1v",
      asset: { type: "native" },
    } as unknown as TransactionIntent;

    const res = await validateIntent("cosmos", intent, balances, fees);
    expect(res.errors).toEqual({});
    expect(res.warnings.claimRewardsFee?.name).toBe("ClaimRewardsFeesWarning");
  });

  it("does not warn on a claimReward whose reward exceeds the fee", async () => {
    const intent = {
      intentType: "staking",
      type: "claimReward",
      mode: "claimReward",
      sender: "cosmos1sender",
      recipient: "",
      amount: 1_000_000n,
      valAddress: "cosmosvaloper1v",
      asset: { type: "native" },
    } as unknown as TransactionIntent;

    const res = await validateIntent("cosmos", intent, balances, fees);
    expect(res.errors).toEqual({});
    expect(res.warnings.claimRewardsFee).toBeUndefined();
  });
});
