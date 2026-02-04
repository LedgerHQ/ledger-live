import { validateIntent } from "./validateIntent";
import type {
  TransactionIntent,
  Balance,
  FeeEstimation,
  MemoNotSupported,
  TxDataNotSupported,
} from "@ledgerhq/coin-framework/api/types";

describe("validateIntent", () => {
  const VALID_SENDER = "erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th";
  const VALID_RECIPIENT = "erd1spyavw0956vq68xj8y4tenjpq2wd5a9p2c6j8gsz7ztyrnpxrruqzu66jx";

  const NATIVE_BALANCE: Balance = {
    value: 1000000000000000000n, // 1 EGLD
    asset: { type: "native" },
  };

  const ESDT_BALANCE: Balance = {
    value: 5000000000000000000n, // 5 tokens
    asset: { type: "esdt", assetReference: "TOKEN-abc123" },
  };

  it("validates intent with sufficient balance successfully", async () => {
    const intent: TransactionIntent<MemoNotSupported, TxDataNotSupported> = {
      intentType: "transaction",
      type: "send",
      sender: VALID_SENDER,
      recipient: VALID_RECIPIENT,
      amount: 500000000000000000n, // 0.5 EGLD
      asset: { type: "native" },
    };

    const fees: FeeEstimation = {
      value: 50000000000000n, // 0.00005 EGLD
    };

    const balances: Balance[] = [NATIVE_BALANCE];

    const result = await validateIntent(intent, balances, fees);

    expect(Object.keys(result.errors)).toHaveLength(0);
    expect(result.amount).toBe(500000000000000000n);
    // totalSpent = amount + fees = 500000000000000000 + 50000000000000 = 500050000000000000
    expect(result.totalSpent).toBe(500050000000000000n);
  });

  it("returns TransactionValidation with no errors for valid intent", async () => {
    const intent: TransactionIntent<MemoNotSupported, TxDataNotSupported> = {
      intentType: "transaction",
      type: "send",
      sender: VALID_SENDER,
      recipient: VALID_RECIPIENT,
      amount: 100000000000000000n, // 0.1 EGLD
      asset: { type: "native" },
    };

    const fees: FeeEstimation = {
      value: 50000000000000n,
    };

    const balances: Balance[] = [NATIVE_BALANCE];

    const result = await validateIntent(intent, balances, fees);

    expect(result).toHaveProperty("errors");
    expect(result).toHaveProperty("warnings");
    expect(result).toHaveProperty("estimatedFees");
    expect(result).toHaveProperty("amount");
    expect(result).toHaveProperty("totalSpent");
    expect(Object.keys(result.errors)).toHaveLength(0);
  });

  it("detects insufficient EGLD balance for transfer + fees", async () => {
    const intent: TransactionIntent<MemoNotSupported, TxDataNotSupported> = {
      intentType: "transaction",
      type: "send",
      sender: VALID_SENDER,
      recipient: VALID_RECIPIENT,
      amount: 1000000000000000000n, // 1 EGLD (exceeds balance)
      asset: { type: "native" },
    };

    const fees: FeeEstimation = {
      value: 50000000000000n,
    };

    const balances: Balance[] = [NATIVE_BALANCE];

    const result = await validateIntent(intent, balances, fees);

    expect(result.errors.amount).toBeDefined();
    expect(result.errors.amount?.message).toContain("Insufficient balance");
  });

  it("detects missing ESDT token balance", async () => {
    const intent: TransactionIntent<MemoNotSupported, TxDataNotSupported> = {
      intentType: "transaction",
      type: "send",
      sender: VALID_SENDER,
      recipient: VALID_RECIPIENT,
      amount: 1000000000000000000n,
      asset: { type: "esdt", assetReference: "TOKEN-xyz789" }, // Different token
    };

    const fees: FeeEstimation = {
      value: 50000000000000n,
    };

    const balances: Balance[] = [NATIVE_BALANCE, ESDT_BALANCE];

    const result = await validateIntent(intent, balances, fees);

    expect(result.errors.amount).toBeDefined();
    expect(result.errors.amount?.message).toContain("Token not found");
  });

  it("validates fees are included in balance calculations", async () => {
    const intent: TransactionIntent<MemoNotSupported, TxDataNotSupported> = {
      intentType: "transaction",
      type: "send",
      sender: VALID_SENDER,
      recipient: VALID_RECIPIENT,
      amount: 950000000000000000n, // 0.95 EGLD
      asset: { type: "native" },
    };

    const fees: FeeEstimation = {
      value: 100000000000000000n, // 0.1 EGLD (total would be 1.05 EGLD, exceeds balance)
    };

    const balances: Balance[] = [NATIVE_BALANCE];

    const result = await validateIntent(intent, balances, fees);

    expect(result.errors.amount).toBeDefined();
    expect(result.totalSpent).toBe(1050000000000000000n); // amount + fees
  });

  it("handles optional customFees parameter", async () => {
    const intent: TransactionIntent<MemoNotSupported, TxDataNotSupported> = {
      intentType: "transaction",
      type: "send",
      sender: VALID_SENDER,
      recipient: VALID_RECIPIENT,
      amount: 500000000000000000n,
      asset: { type: "native" },
    };

    const balances: Balance[] = [NATIVE_BALANCE];

    // Without customFees, fees should be 0n
    const result1 = await validateIntent(intent, balances);
    expect(result1.estimatedFees).toBe(0n);

    // With customFees, fees should be used
    const fees: FeeEstimation = { value: 50000000000000n };
    const result2 = await validateIntent(intent, balances, fees);
    expect(result2.estimatedFees).toBe(50000000000000n);
  });

  it("validates sender address format", async () => {
    const intent: TransactionIntent<MemoNotSupported, TxDataNotSupported> = {
      intentType: "transaction",
      type: "send",
      sender: "invalid-address",
      recipient: VALID_RECIPIENT,
      amount: 100000000000000000n,
      asset: { type: "native" },
    };

    const balances: Balance[] = [NATIVE_BALANCE];

    const result = await validateIntent(intent, balances);

    expect(result.errors.sender).toBeDefined();
    expect(result.errors.sender?.message).toContain("Invalid sender address");
  });

  it("validates recipient address format", async () => {
    const intent: TransactionIntent<MemoNotSupported, TxDataNotSupported> = {
      intentType: "transaction",
      type: "send",
      sender: VALID_SENDER,
      recipient: "invalid-address",
      amount: 100000000000000000n,
      asset: { type: "native" },
    };

    const balances: Balance[] = [NATIVE_BALANCE];

    const result = await validateIntent(intent, balances);

    expect(result.errors.recipient).toBeDefined();
    expect(result.errors.recipient?.message).toContain("Invalid recipient address");
  });

  it("validates amount > 0 requirement", async () => {
    const intent: TransactionIntent<MemoNotSupported, TxDataNotSupported> = {
      intentType: "transaction",
      type: "send",
      sender: VALID_SENDER,
      recipient: VALID_RECIPIENT,
      amount: 0n,
      asset: { type: "native" },
    };

    const balances: Balance[] = [NATIVE_BALANCE];

    const result = await validateIntent(intent, balances);

    expect(result.errors.amount).toBeDefined();
    expect(result.errors.amount?.message).toContain("Amount must be greater than 0");
  });

  it("handles useAllAmount flag correctly", async () => {
    const intent: TransactionIntent<MemoNotSupported, TxDataNotSupported> = {
      intentType: "transaction",
      type: "send",
      sender: VALID_SENDER,
      recipient: VALID_RECIPIENT,
      amount: 0n, // Will be calculated from balance
      asset: { type: "native" },
      useAllAmount: true,
    };

    const fees: FeeEstimation = {
      value: 50000000000000n,
    };

    const balances: Balance[] = [NATIVE_BALANCE];

    const result = await validateIntent(intent, balances, fees);

    // Amount should be calculated: balance - fees = 1 EGLD - 0.00005 EGLD
    expect(result.amount).toBe(999950000000000000n);
    expect(result.totalSpent).toBe(1000000000000000000n); // amount + fees = balance
    expect(Object.keys(result.errors)).toHaveLength(0);
  });

  it("returns correct estimatedFees and totalSpent values", async () => {
    const intent: TransactionIntent<MemoNotSupported, TxDataNotSupported> = {
      intentType: "transaction",
      type: "send",
      sender: VALID_SENDER,
      recipient: VALID_RECIPIENT,
      amount: 300000000000000000n, // 0.3 EGLD
      asset: { type: "native" },
    };

    const fees: FeeEstimation = {
      value: 70000000000000n, // 0.00007 EGLD
    };

    const balances: Balance[] = [NATIVE_BALANCE];

    const result = await validateIntent(intent, balances, fees);

    expect(result.estimatedFees).toBe(70000000000000n);
    // totalSpent = amount + fees = 300000000000000000 + 70000000000000 = 300070000000000000
    expect(result.totalSpent).toBe(300070000000000000n);
    expect(result.amount).toBe(300000000000000000n);
  });

  it("validates ESDT transfer with sufficient token balance", async () => {
    const intent: TransactionIntent<MemoNotSupported, TxDataNotSupported> = {
      intentType: "transaction",
      type: "send",
      sender: VALID_SENDER,
      recipient: VALID_RECIPIENT,
      amount: 2000000000000000000n, // 2 tokens
      asset: { type: "esdt", assetReference: "TOKEN-abc123" },
    };

    const fees: FeeEstimation = {
      value: 50000000000000n,
    };

    const balances: Balance[] = [NATIVE_BALANCE, ESDT_BALANCE];

    const result = await validateIntent(intent, balances, fees);

    expect(Object.keys(result.errors)).toHaveLength(0);
    expect(result.amount).toBe(2000000000000000000n);
    expect(result.totalSpent).toBe(2000000000000000000n); // Only token amount, fees separate
  });

  it("validates ESDT transfer with insufficient token balance", async () => {
    const intent: TransactionIntent<MemoNotSupported, TxDataNotSupported> = {
      intentType: "transaction",
      type: "send",
      sender: VALID_SENDER,
      recipient: VALID_RECIPIENT,
      amount: 10000000000000000000n, // 10 tokens (exceeds balance)
      asset: { type: "esdt", assetReference: "TOKEN-abc123" },
    };

    const fees: FeeEstimation = {
      value: 50000000000000n,
    };

    const balances: Balance[] = [NATIVE_BALANCE, ESDT_BALANCE];

    const result = await validateIntent(intent, balances, fees);

    expect(result.errors.amount).toBeDefined();
    expect(result.errors.amount?.message).toContain("Insufficient token balance");
  });

  it("validates ESDT transfer with insufficient native balance for fees", async () => {
    const intent: TransactionIntent<MemoNotSupported, TxDataNotSupported> = {
      intentType: "transaction",
      type: "send",
      sender: VALID_SENDER,
      recipient: VALID_RECIPIENT,
      amount: 2000000000000000000n,
      asset: { type: "esdt", assetReference: "TOKEN-abc123" },
    };

    const fees: FeeEstimation = {
      value: 2000000000000000000n, // 2 EGLD (exceeds native balance)
    };

    const balances: Balance[] = [NATIVE_BALANCE, ESDT_BALANCE];

    const result = await validateIntent(intent, balances, fees);

    // Fees error is now in separate key to avoid overwriting token balance errors
    expect(result.errors.fees).toBeDefined();
    expect(result.errors.fees?.message).toContain("Insufficient balance for fees");
  });

  it("detects both insufficient token balance and insufficient fees for ESDT transfer", async () => {
    const intent: TransactionIntent<MemoNotSupported, TxDataNotSupported> = {
      intentType: "transaction",
      type: "send",
      sender: VALID_SENDER,
      recipient: VALID_RECIPIENT,
      amount: 10000000000000000000n, // 10 tokens (exceeds balance)
      asset: { type: "esdt", assetReference: "TOKEN-abc123" },
    };

    const fees: FeeEstimation = {
      value: 2000000000000000000n, // 2 EGLD (exceeds native balance)
    };

    const balances: Balance[] = [NATIVE_BALANCE, ESDT_BALANCE];

    const result = await validateIntent(intent, balances, fees);

    // Both errors should be present (not overwritten)
    expect(result.errors.amount).toBeDefined();
    expect(result.errors.amount?.message).toContain("Insufficient token balance");
    expect(result.errors.fees).toBeDefined();
    expect(result.errors.fees?.message).toContain("Insufficient balance for fees");
  });

  it("validates empty balances array", async () => {
    const intent: TransactionIntent<MemoNotSupported, TxDataNotSupported> = {
      intentType: "transaction",
      type: "send",
      sender: VALID_SENDER,
      recipient: VALID_RECIPIENT,
      amount: 100000000000000000n,
      asset: { type: "native" },
    };

    const balances: Balance[] = [];

    const result = await validateIntent(intent, balances);

    expect(result.errors.balances).toBeDefined();
    expect(result.errors.balances?.message).toContain("Balances array cannot be empty");
  });

  it("validates missing native balance in balances array", async () => {
    const intent: TransactionIntent<MemoNotSupported, TxDataNotSupported> = {
      intentType: "transaction",
      type: "send",
      sender: VALID_SENDER,
      recipient: VALID_RECIPIENT,
      amount: 100000000000000000n,
      asset: { type: "native" },
    };

    const balances: Balance[] = [ESDT_BALANCE]; // Only ESDT, no native

    const result = await validateIntent(intent, balances);

    expect(result.errors.balances).toBeDefined();
    expect(result.errors.balances?.message).toContain("Native balance not found");
  });

  it("validates multiple native balances (invalid state)", async () => {
    const intent: TransactionIntent<MemoNotSupported, TxDataNotSupported> = {
      intentType: "transaction",
      type: "send",
      sender: VALID_SENDER,
      recipient: VALID_RECIPIENT,
      amount: 100000000000000000n,
      asset: { type: "native" },
    };

    const balances: Balance[] = [
      NATIVE_BALANCE,
      { ...NATIVE_BALANCE, value: 500000000000000000n },
    ];

    const result = await validateIntent(intent, balances);

    expect(result.errors.balances).toBeDefined();
    expect(result.errors.balances?.message).toContain("Multiple native balances found");
  });

  it("validates negative native balance (invalid state)", async () => {
    const intent: TransactionIntent<MemoNotSupported, TxDataNotSupported> = {
      intentType: "transaction",
      type: "send",
      sender: VALID_SENDER,
      recipient: VALID_RECIPIENT,
      amount: 100000000000000000n,
      asset: { type: "native" },
    };

    const NEGATIVE_BALANCE: Balance = {
      value: -1000000000000000000n, // Negative balance (invalid state)
      asset: { type: "native" },
    };

    const balances: Balance[] = [NEGATIVE_BALANCE];

    const result = await validateIntent(intent, balances);

    expect(result.errors.balances).toBeDefined();
    expect(result.errors.balances?.message).toContain("Invalid native balance: negative value");
  });

  it("handles useAllAmount when balance exactly equals fees", async () => {
    const intent: TransactionIntent<MemoNotSupported, TxDataNotSupported> = {
      intentType: "transaction",
      type: "send",
      sender: VALID_SENDER,
      recipient: VALID_RECIPIENT,
      amount: 0n,
      asset: { type: "native" },
      useAllAmount: true,
    };

    const fees: FeeEstimation = {
      value: NATIVE_BALANCE.value, // Balance exactly equals fees
    };

    const balances: Balance[] = [NATIVE_BALANCE];

    const result = await validateIntent(intent, balances, fees);

    // Amount should be 0n (spendable = balance - fees = 0)
    expect(result.amount).toBe(0n);
    expect(result.totalSpent).toBe(NATIVE_BALANCE.value); // amount + fees = balance
    expect(result.errors.amount).toBeUndefined(); // No error, just 0 amount
  });

  it("handles useAllAmount when fees exceed balance", async () => {
    const intent: TransactionIntent<MemoNotSupported, TxDataNotSupported> = {
      intentType: "transaction",
      type: "send",
      sender: VALID_SENDER,
      recipient: VALID_RECIPIENT,
      amount: 0n,
      asset: { type: "native" },
      useAllAmount: true,
    };

    const fees: FeeEstimation = {
      value: NATIVE_BALANCE.value + 100000000000000000n, // Fees exceed balance
    };

    const balances: Balance[] = [NATIVE_BALANCE];

    const result = await validateIntent(intent, balances, fees);

    // Amount should be 0n (spendable would be negative, clamped to 0)
    expect(result.amount).toBe(0n);
    // Should have error for insufficient balance
    expect(result.errors.amount).toBeDefined();
    expect(result.errors.amount?.message).toContain("Insufficient balance");
  });

  it("handles useAllAmount for ESDT token transfer", async () => {
    const intent: TransactionIntent<MemoNotSupported, TxDataNotSupported> = {
      intentType: "transaction",
      type: "send",
      sender: VALID_SENDER,
      recipient: VALID_RECIPIENT,
      amount: 0n, // Will be calculated from balance
      asset: { type: "esdt", assetReference: "TOKEN-abc123" },
      useAllAmount: true,
    };

    const fees: FeeEstimation = {
      value: 50000000000000n,
    };

    const balances: Balance[] = [NATIVE_BALANCE, ESDT_BALANCE];

    const result = await validateIntent(intent, balances, fees);

    // Amount should be the full token balance for useAllAmount with ESDT
    expect(result.amount).toBe(ESDT_BALANCE.value);
    expect(result.totalSpent).toBe(ESDT_BALANCE.value);
    expect(Object.keys(result.errors)).toHaveLength(0);
  });

  it("handles useAllAmount for non-existent ESDT token", async () => {
    const intent: TransactionIntent<MemoNotSupported, TxDataNotSupported> = {
      intentType: "transaction",
      type: "send",
      sender: VALID_SENDER,
      recipient: VALID_RECIPIENT,
      amount: 0n,
      asset: { type: "esdt", assetReference: "NONEXISTENT-xyz789" },
      useAllAmount: true,
    };

    const fees: FeeEstimation = {
      value: 50000000000000n,
    };

    const balances: Balance[] = [NATIVE_BALANCE, ESDT_BALANCE];

    const result = await validateIntent(intent, balances, fees);

    // Amount should be 0n for non-existent token
    expect(result.amount).toBe(0n);
    expect(result.errors.amount).toBeDefined();
    expect(result.errors.amount?.message).toContain("Token not found");
  });
});
