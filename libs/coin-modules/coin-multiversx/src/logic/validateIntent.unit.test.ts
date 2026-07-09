import { validateIntent } from "./validateIntent";
import type {
  Balance,
  TransactionIntent,
  StakingTransactionIntent,
} from "@ledgerhq/coin-module-framework/api/index";

const SENDER = "erd1spyavw0956vq68xj8y4tenjpq2wd5a9p2c6j8gsz7ztyrnpxrruqzu66jx";
const RECIPIENT = "erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqplllst77y4l";

const NATIVE_BALANCES: Balance[] = [{ value: 5000000000000000000n, asset: { type: "native" } }];

function makeNativeIntent(amount = 1000000000000000000n): TransactionIntent {
  return {
    intentType: "transaction",
    type: "send",
    sender: SENDER,
    recipient: RECIPIENT,
    amount,
    asset: { type: "native" },
  };
}

const FEES = { value: 50000000000000n };

describe("validateIntent", () => {
  it("passes for valid native send", async () => {
    const result = await validateIntent(makeNativeIntent(), NATIVE_BALANCES, FEES);
    expect(result.errors).toMatchObject({});
  });

  it("errors when recipient is missing for send", async () => {
    const intent = { ...makeNativeIntent(), recipient: "" };
    const result = await validateIntent(intent, NATIVE_BALANCES, FEES);
    expect(Object.keys(result.errors)).toContain("recipient");
  });

  it("errors when recipient equals sender for a native send", async () => {
    const intent = { ...makeNativeIntent(), recipient: SENDER };
    const result = await validateIntent(intent, NATIVE_BALANCES, FEES);
    expect(result.errors.recipient?.name).toBe("InvalidAddressBecauseDestinationIsAlsoSource");
  });

  it("errors when the recipient is not a valid address", async () => {
    const intent = { ...makeNativeIntent(), recipient: "not-a-valid-erd-address" };
    const result = await validateIntent(intent, NATIVE_BALANCES, FEES);
    expect(result.errors.recipient?.name).toBe("InvalidAddress");
  });

  it("errors when amount is zero for native send", async () => {
    const result = await validateIntent(makeNativeIntent(0n), NATIVE_BALANCES, FEES);
    expect(Object.keys(result.errors)).toContain("amount");
  });

  it("errors when balance insufficient", async () => {
    const lowBalances: Balance[] = [{ value: 100n, asset: { type: "native" } }];
    const result = await validateIntent(makeNativeIntent(10000n), lowBalances, FEES);
    expect(Object.keys(result.errors)).toContain("amount");
  });

  it("claimRewards with amount 0 is valid", async () => {
    const intent = {
      intentType: "staking",
      type: "claimRewards",
      sender: SENDER,
      recipient: RECIPIENT,
      amount: 0n,
      asset: { type: "native" },
    } as unknown as StakingTransactionIntent;
    const result = await validateIntent(intent, NATIVE_BALANCES, FEES);
    expect(Object.keys(result.errors)).not.toContain("amount");
  });

  it("errors when delegate amount + fees exceeds native balance", async () => {
    // delegate moves `amount` EGLD to the staking contract, so it must be
    // validated as amount + fees against the native balance (not fees only).
    const balances: Balance[] = [{ value: 1000000000000000000n, asset: { type: "native" } }];
    const intent = {
      intentType: "staking",
      type: "delegate",
      sender: SENDER,
      recipient: RECIPIENT,
      amount: 1000000000000000000n, // equal to balance, leaves nothing for fees
      asset: { type: "native" },
    } as unknown as StakingTransactionIntent;
    const result = await validateIntent(intent, balances, FEES);
    expect(Object.keys(result.errors)).toContain("amount");
  });

  it("enforces the min delegation amount for stake.undelegate (same as unDelegate)", async () => {
    const belowMin = { value: 500000000000000000n }; // 0.5 EGLD < 1 EGLD min
    for (const type of ["unDelegate", "stake.undelegate"]) {
      const intent = {
        intentType: "staking",
        type,
        sender: SENDER,
        recipient: RECIPIENT,
        amount: belowMin.value,
        asset: { type: "native" },
      } as unknown as StakingTransactionIntent;
      const result = await validateIntent(intent, NATIVE_BALANCES, FEES);
      expect(Object.keys(result.errors)).toContain("amount");
    }
  });

  it("estimates fees when none are provided (does not treat them as 0)", async () => {
    // full-balance native send with no customFees: must fail because amount+fees
    // exceeds the balance once fees are estimated (rather than passing with fee 0).
    const intent = makeNativeIntent(5000000000000000000n); // == full balance
    const result = await validateIntent(intent, NATIVE_BALANCES); // no customFees
    expect(result.estimatedFees).toBeGreaterThan(0n);
    expect(Object.keys(result.errors)).toContain("amount");
  });

  it("useAllAmount (native) resolves amount to spendable minus fees", async () => {
    const intent = { ...makeNativeIntent(0n), useAllAmount: true };
    const result = await validateIntent(intent, NATIVE_BALANCES, FEES);
    expect(result.errors).toMatchObject({});
    expect(result.amount).toBe(5000000000000000000n - FEES.value);
  });

  it("useAllAmount (ESDT) resolves amount to the full token balance", async () => {
    const esdtBalances: Balance[] = [
      { value: 5000000000000000000n, asset: { type: "native" } },
      { value: 4200n, asset: { type: "esdt", assetReference: "USDC-c76f1f" } },
    ];
    const intent: TransactionIntent = {
      intentType: "transaction",
      type: "send",
      sender: SENDER,
      recipient: RECIPIENT,
      amount: 0n,
      useAllAmount: true,
      asset: { type: "esdt", assetReference: "USDC-c76f1f" },
    };
    const result = await validateIntent(intent, esdtBalances, FEES);
    expect(result.errors).toMatchObject({});
    expect(result.amount).toBe(4200n);
  });

  it("flags NotEnoughEGLDForFees for an ESDT transfer when native EGLD can't cover fees", async () => {
    const esdtBalances: Balance[] = [
      { value: 10n, asset: { type: "native" } }, // not enough for the fee
      { value: 5000n, asset: { type: "esdt", assetReference: "USDC-c76f1f" } },
    ];
    const intent: TransactionIntent = {
      intentType: "transaction",
      type: "send",
      sender: SENDER,
      recipient: RECIPIENT,
      amount: 100n, // token amount is covered
      asset: { type: "esdt", assetReference: "USDC-c76f1f" },
    };
    const result = await validateIntent(intent, esdtBalances, FEES);
    expect(result.errors.gasPrice?.name).toBe("NotEnoughEGLDForFees");
    expect(Object.keys(result.errors)).not.toContain("amount"); // token amount is sufficient
  });

  it("errors for ESDT when token balance insufficient", async () => {
    const esdtBalances: Balance[] = [
      { value: 5000000000000000000n, asset: { type: "native" } },
      { value: 50n, asset: { type: "esdt", assetReference: "USDC-c76f1f" } },
    ];
    const intent: TransactionIntent = {
      intentType: "transaction",
      type: "send",
      sender: SENDER,
      recipient: RECIPIENT,
      amount: 100n,
      asset: { type: "esdt", assetReference: "USDC-c76f1f" },
    };
    const result = await validateIntent(intent, esdtBalances, FEES);
    expect(Object.keys(result.errors)).toContain("amount");
  });
});
