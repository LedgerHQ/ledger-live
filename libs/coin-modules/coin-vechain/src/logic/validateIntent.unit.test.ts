import type { Balance, TransactionIntent } from "@ledgerhq/coin-module-framework/api/index";
import { validateIntent } from "./validateIntent";

const SENDER = "0x0fe6688548f0C303932bB197B0A96034f1d74dba";
const RECIPIENT = "0x02961B92B8D20A4ea12f1f1CeFA74Dd7B4355A86";

const NATIVE_INTENT: TransactionIntent = {
  intentType: "transaction",
  type: "send",
  sender: SENDER,
  recipient: RECIPIENT,
  amount: 1_000n,
  asset: { type: "native" },
};

const BALANCES: Balance[] = [
  { value: 10_000n, asset: { type: "native" } },
  { value: 5_000n, asset: { type: "token", assetReference: "0xvtho" } },
];

describe("validateIntent", () => {
  it("passes for a well-formed native send with sufficient balance and fees", async () => {
    const result = await validateIntent(NATIVE_INTENT, BALANCES, { value: 100n });

    expect(result.errors).toEqual({});
    expect(result.amount).toBe(1_000n);
    expect(result.totalSpent).toBe(1_000n);
  });

  it("flags a missing recipient", async () => {
    const result = await validateIntent({ ...NATIVE_INTENT, recipient: "" }, BALANCES);

    expect(result.errors.recipient).toBeInstanceOf(Error);
  });

  it("flags an ill-formed recipient address", async () => {
    const result = await validateIntent(
      { ...NATIVE_INTENT, recipient: "not-an-address" },
      BALANCES,
    );

    expect(result.errors.recipient).toBeInstanceOf(Error);
  });

  it("warns when the recipient equals the sender", async () => {
    const result = await validateIntent({ ...NATIVE_INTENT, recipient: SENDER }, BALANCES);

    expect(result.warnings.recipient).toBeInstanceOf(Error);
  });

  it("flags a zero amount when not sending the full balance", async () => {
    const result = await validateIntent({ ...NATIVE_INTENT, amount: 0n }, BALANCES);

    expect(result.errors.amount).toBeInstanceOf(Error);
  });

  it("flags insufficient native balance for the requested amount", async () => {
    const result = await validateIntent({ ...NATIVE_INTENT, amount: 999_999n }, BALANCES);

    expect(result.errors.amount).toBeInstanceOf(Error);
  });

  it("flags NotEnoughVTHO when fees exceed the VTHO balance, even with enough VET", async () => {
    const result = await validateIntent(NATIVE_INTENT, BALANCES, { value: 999_999n });

    expect(result.errors.amount?.name).toBe("NotEnoughVTHO");
  });

  it("subtracts the estimated fee from the spendable amount for a max VTHO send", async () => {
    const tokenIntent: TransactionIntent = {
      ...NATIVE_INTENT,
      asset: { type: "token", assetReference: "0xvtho" },
      useAllAmount: true,
    };

    const result = await validateIntent(tokenIntent, BALANCES, { value: 100n });

    expect(result.amount).toBe(4_900n); // 5000 VTHO balance - 100 fee
    expect(result.totalSpent).toBe(5_000n);
  });

  it("flags NotEnoughBalance for a max VTHO send when the fee consumes the whole balance", async () => {
    const tokenIntent: TransactionIntent = {
      ...NATIVE_INTENT,
      asset: { type: "token", assetReference: "0xvtho" },
      useAllAmount: true,
    };

    const result = await validateIntent(tokenIntent, BALANCES, { value: 5_000n }); // fee == full VTHO balance

    expect(result.amount).toBe(0n);
    expect(result.errors.amount?.name).toBe("NotEnoughBalance");
  });

  it("does not subtract fees from a max native VET send (fees are paid in VTHO)", async () => {
    const nativeMax: TransactionIntent = { ...NATIVE_INTENT, useAllAmount: true };

    const result = await validateIntent(nativeMax, BALANCES, { value: 100n });

    expect(result.amount).toBe(10_000n);
  });

  it("passes a native send at the exact balance boundary (amount == available)", async () => {
    const result = await validateIntent({ ...NATIVE_INTENT, amount: 10_000n }, BALANCES, {
      value: 100n,
    });
    expect(result.errors).toEqual({});
    expect(result.amount).toBe(10_000n);
  });

  it("flags a native send one wei over the balance", async () => {
    const result = await validateIntent({ ...NATIVE_INTENT, amount: 10_001n }, BALANCES, {
      value: 100n,
    });
    expect(result.errors.amount?.name).toBe("NotEnoughBalance");
  });

  it("passes a dust native amount (1 wei)", async () => {
    const result = await validateIntent({ ...NATIVE_INTENT, amount: 1n }, BALANCES, {
      value: 100n,
    });
    expect(result.errors).toEqual({});
    expect(result.amount).toBe(1n);
  });

  it("does not flag NotEnoughVTHO when the fee equals the VTHO balance exactly", async () => {
    const result = await validateIntent(NATIVE_INTENT, BALANCES, { value: 5_000n });
    expect(result.errors.amount).toBeUndefined();
  });

  it("flags NotEnoughVTHO when the fee is one wei over the VTHO balance", async () => {
    const result = await validateIntent(NATIVE_INTENT, BALANCES, { value: 5_001n });
    expect(result.errors.amount?.name).toBe("NotEnoughVTHO");
  });

  const tokenIntent = (amount: bigint): TransactionIntent => ({
    ...NATIVE_INTENT,
    asset: { type: "token", assetReference: "0xvtho" },
    amount,
  });

  it("passes a VTHO send at the exact spendable boundary (amount + fee == balance)", async () => {
    const result = await validateIntent(tokenIntent(4_900n), BALANCES, { value: 100n });
    expect(result.errors).toEqual({});
  });

  it("flags a VTHO send one wei over the spendable boundary (amount + fee > balance)", async () => {
    const result = await validateIntent(tokenIntent(4_901n), BALANCES, { value: 100n });
    expect(result.errors.amount?.name).toBe("NotEnoughBalance");
  });

  it("passes a dust VTHO amount (1 wei)", async () => {
    const result = await validateIntent(tokenIntent(1n), BALANCES, { value: 100n });
    expect(result.errors).toEqual({});
  });
});
