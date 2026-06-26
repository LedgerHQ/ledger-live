import { validateIntent } from "./validateIntent";
import type {
  TransactionIntent,
  Balance,
  FeeEstimation,
  MemoNotSupported,
  TxDataNotSupported,
} from "@ledgerhq/coin-module-framework/api/index";

describe("validateIntent", () => {
  const VALID_SENDER = "erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th";
  const VALID_RECIPIENT = "erd1spyavw0956vq68xj8y4tenjpq2wd5a9p2c6j8gsz7ztyrnpxrruqzu66jx";

  const NATIVE_BALANCE: Balance = {
    value: 1000000000000000000n,
    asset: { type: "native" },
  };

  const ESDT_BALANCE: Balance = {
    value: 5000000000000000000n,
    asset: { type: "esdt", assetReference: "TOKEN-abc123" },
  };

  it("validates intent with sufficient balance successfully", async () => {
    const intent: TransactionIntent<MemoNotSupported, TxDataNotSupported> = {
      intentType: "transaction",
      type: "send",
      sender: VALID_SENDER,
      recipient: VALID_RECIPIENT,
      amount: 500000000000000000n,
      asset: { type: "native" },
    };

    const fees: FeeEstimation = {
      value: 50000000000000n,
    };

    const balances: Balance[] = [NATIVE_BALANCE];

    const result = await validateIntent(intent, balances, fees);

    expect(Object.keys(result.errors)).toHaveLength(0);
    expect(result.amount).toBe(500000000000000000n);
    expect(result.totalSpent).toBe(500050000000000000n);
  });

  it("returns TransactionValidation with no errors for valid intent", async () => {
    const intent: TransactionIntent<MemoNotSupported, TxDataNotSupported> = {
      intentType: "transaction",
      type: "send",
      sender: VALID_SENDER,
      recipient: VALID_RECIPIENT,
      amount: 100000000000000000n,
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
      amount: 1000000000000000000n,
      asset: { type: "native" },
    };

    const fees: FeeEstimation = {
      value: 50000000000000n,
    };

    const balances: Balance[] = [NATIVE_BALANCE];

    const result = await validateIntent(intent, balances, fees);

    expect(result.errors.amount?.name).toBe("NotEnoughBalance");
  });

  it("detects missing ESDT token balance", async () => {
    const intent: TransactionIntent<MemoNotSupported, TxDataNotSupported> = {
      intentType: "transaction",
      type: "send",
      sender: VALID_SENDER,
      recipient: VALID_RECIPIENT,
      amount: 1000000000000000000n,
      asset: { type: "esdt", assetReference: "TOKEN-xyz789" },
    };

    const fees: FeeEstimation = {
      value: 50000000000000n,
    };

    const balances: Balance[] = [NATIVE_BALANCE, ESDT_BALANCE];

    const result = await validateIntent(intent, balances, fees);

    expect(result.errors.amount?.name).toBe("NotEnoughBalance");
  });

  it("validates fees are included in balance calculations", async () => {
    const intent: TransactionIntent<MemoNotSupported, TxDataNotSupported> = {
      intentType: "transaction",
      type: "send",
      sender: VALID_SENDER,
      recipient: VALID_RECIPIENT,
      amount: 950000000000000000n,
      asset: { type: "native" },
    };

    const fees: FeeEstimation = {
      value: 100000000000000000n,
    };

    const balances: Balance[] = [NATIVE_BALANCE];

    const result = await validateIntent(intent, balances, fees);

    expect(result.errors.amount?.name).toBe("NotEnoughBalance");
    expect(result.totalSpent).toBe(1050000000000000000n);
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

    const result1 = await validateIntent(intent, balances);
    expect(result1.estimatedFees).toBe(0n);

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

    expect(result.errors.sender?.name).toBe("InvalidAddress");
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

    expect(result.errors.recipient?.name).toBe("InvalidAddress");
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

    expect(result.errors.amount?.name).toBe("AmountRequired");
  });

  it("handles useAllAmount flag correctly", async () => {
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
      value: 50000000000000n,
    };

    const balances: Balance[] = [NATIVE_BALANCE];

    const result = await validateIntent(intent, balances, fees);

    expect(result.amount).toBe(999950000000000000n);
    expect(result.totalSpent).toBe(1000000000000000000n);
    expect(Object.keys(result.errors)).toHaveLength(0);
  });

  it("returns correct estimatedFees and totalSpent values", async () => {
    const intent: TransactionIntent<MemoNotSupported, TxDataNotSupported> = {
      intentType: "transaction",
      type: "send",
      sender: VALID_SENDER,
      recipient: VALID_RECIPIENT,
      amount: 300000000000000000n,
      asset: { type: "native" },
    };

    const fees: FeeEstimation = {
      value: 70000000000000n,
    };

    const balances: Balance[] = [NATIVE_BALANCE];

    const result = await validateIntent(intent, balances, fees);

    expect(result.estimatedFees).toBe(70000000000000n);
    expect(result.totalSpent).toBe(300070000000000000n);
    expect(result.amount).toBe(300000000000000000n);
  });

  it("validates ESDT transfer with sufficient token balance", async () => {
    const intent: TransactionIntent<MemoNotSupported, TxDataNotSupported> = {
      intentType: "transaction",
      type: "send",
      sender: VALID_SENDER,
      recipient: VALID_RECIPIENT,
      amount: 2000000000000000000n,
      asset: { type: "esdt", assetReference: "TOKEN-abc123" },
    };

    const fees: FeeEstimation = {
      value: 50000000000000n,
    };

    const balances: Balance[] = [NATIVE_BALANCE, ESDT_BALANCE];

    const result = await validateIntent(intent, balances, fees);

    expect(Object.keys(result.errors)).toHaveLength(0);
    expect(result.amount).toBe(2000000000000000000n);
    expect(result.totalSpent).toBe(2000000000000000000n);
  });

  it("validates ESDT transfer with insufficient token balance", async () => {
    const intent: TransactionIntent<MemoNotSupported, TxDataNotSupported> = {
      intentType: "transaction",
      type: "send",
      sender: VALID_SENDER,
      recipient: VALID_RECIPIENT,
      amount: 10000000000000000000n,
      asset: { type: "esdt", assetReference: "TOKEN-abc123" },
    };

    const fees: FeeEstimation = {
      value: 50000000000000n,
    };

    const balances: Balance[] = [NATIVE_BALANCE, ESDT_BALANCE];

    const result = await validateIntent(intent, balances, fees);

    expect(result.errors.amount?.name).toBe("NotEnoughBalance");
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
      value: 2000000000000000000n,
    };

    const balances: Balance[] = [NATIVE_BALANCE, ESDT_BALANCE];

    const result = await validateIntent(intent, balances, fees);

    expect(result.errors.fees?.name).toBe("NotEnoughEGLDForFees");
  });

  it("detects both insufficient token balance and insufficient fees for ESDT transfer", async () => {
    const intent: TransactionIntent<MemoNotSupported, TxDataNotSupported> = {
      intentType: "transaction",
      type: "send",
      sender: VALID_SENDER,
      recipient: VALID_RECIPIENT,
      amount: 10000000000000000000n,
      asset: { type: "esdt", assetReference: "TOKEN-abc123" },
    };

    const fees: FeeEstimation = {
      value: 2000000000000000000n,
    };

    const balances: Balance[] = [NATIVE_BALANCE, ESDT_BALANCE];

    const result = await validateIntent(intent, balances, fees);

    expect(result.errors.amount?.name).toBe("NotEnoughBalance");
    expect(result.errors.fees?.name).toBe("NotEnoughEGLDForFees");
  });

  it("treats an empty balances array as insufficient balance", async () => {
    const intent: TransactionIntent<MemoNotSupported, TxDataNotSupported> = {
      intentType: "transaction",
      type: "send",
      sender: VALID_SENDER,
      recipient: VALID_RECIPIENT,
      amount: 100000000000000000n,
      asset: { type: "native" },
    };

    const result = await validateIntent(intent, []);

    expect(result.errors.amount?.name).toBe("NotEnoughBalance");
    expect(result.errors.balances).toBeUndefined();
  });

  it("treats a missing native balance as insufficient balance", async () => {
    const intent: TransactionIntent<MemoNotSupported, TxDataNotSupported> = {
      intentType: "transaction",
      type: "send",
      sender: VALID_SENDER,
      recipient: VALID_RECIPIENT,
      amount: 100000000000000000n,
      asset: { type: "native" },
    };

    const balances: Balance[] = [ESDT_BALANCE];

    const result = await validateIntent(intent, balances);

    expect(result.errors.amount?.name).toBe("NotEnoughBalance");
    expect(result.errors.balances).toBeUndefined();
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
      value: NATIVE_BALANCE.value,
    };

    const balances: Balance[] = [NATIVE_BALANCE];

    const result = await validateIntent(intent, balances, fees);

    expect(result.amount).toBe(0n);
    expect(result.totalSpent).toBe(NATIVE_BALANCE.value);
    expect(result.errors.amount).toBeUndefined();
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
      value: NATIVE_BALANCE.value + 100000000000000000n,
    };

    const balances: Balance[] = [NATIVE_BALANCE];

    const result = await validateIntent(intent, balances, fees);

    expect(result.amount).toBe(0n);
    expect(result.errors.amount?.name).toBe("NotEnoughBalance");
  });

  it("handles useAllAmount for ESDT token transfer", async () => {
    const intent: TransactionIntent<MemoNotSupported, TxDataNotSupported> = {
      intentType: "transaction",
      type: "send",
      sender: VALID_SENDER,
      recipient: VALID_RECIPIENT,
      amount: 0n,
      asset: { type: "esdt", assetReference: "TOKEN-abc123" },
      useAllAmount: true,
    };

    const fees: FeeEstimation = {
      value: 50000000000000n,
    };

    const balances: Balance[] = [NATIVE_BALANCE, ESDT_BALANCE];

    const result = await validateIntent(intent, balances, fees);

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

    expect(result.amount).toBe(0n);
    expect(result.errors.amount?.name).toBe("NotEnoughBalance");
  });

  describe("asset type validation (transfers)", () => {
    it("rejects an unsupported asset type", async () => {
      const intent = {
        intentType: "transaction",
        type: "send",
        sender: VALID_SENDER,
        recipient: VALID_RECIPIENT,
        amount: 1000000n,
        asset: { type: "unknown" },
      } as unknown as TransactionIntent<MemoNotSupported, TxDataNotSupported>;

      const result = await validateIntent(intent, [NATIVE_BALANCE]);

      expect(result.errors.asset?.name).toBe("MultiversXUnsupportedAssetType");
    });

    it("rejects an ESDT transfer with an empty assetReference", async () => {
      const intent: TransactionIntent<MemoNotSupported, TxDataNotSupported> = {
        intentType: "transaction",
        type: "send",
        sender: VALID_SENDER,
        recipient: VALID_RECIPIENT,
        amount: 1000000n,
        asset: { type: "esdt", assetReference: "" },
      };

      const result = await validateIntent(intent, [NATIVE_BALANCE]);

      expect(result.errors.asset?.name).toBe("MultiversXTokenIdentifierRequired");
    });
  });

  describe("staking intent validation", () => {
    const VALIDATOR = "erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqppllllls9ftvxy";
    const TEN_EGLD = 10000000000000000000n;
    const stakingBalance: Balance = { value: 20000000000000000000n, asset: { type: "native" } };

    const makeStakingIntent = (
      overrides: Partial<TransactionIntent<MemoNotSupported, TxDataNotSupported>> = {},
    ): TransactionIntent<MemoNotSupported, TxDataNotSupported> =>
      ({
        intentType: "staking",
        type: "delegate",
        sender: VALID_SENDER,
        recipient: VALIDATOR,
        amount: TEN_EGLD,
        asset: { type: "native" },
        ...overrides,
      }) as TransactionIntent<MemoNotSupported, TxDataNotSupported>;

    it("validates a delegate intent with sufficient balance", async () => {
      const result = await validateIntent(makeStakingIntent(), [stakingBalance]);

      expect(Object.keys(result.errors)).toHaveLength(0);
      expect(result.amount).toBe(TEN_EGLD);
    });

    it("does not require an amount for fee-only operations (claimRewards)", async () => {
      const result = await validateIntent(makeStakingIntent({ type: "claimRewards", amount: 0n }), [
        stakingBalance,
      ]);

      expect(result.errors.amount).toBeUndefined();
      expect(result.amount).toBe(0n);
    });

    it("rejects an unsupported staking type", async () => {
      const result = await validateIntent(makeStakingIntent({ type: "invalidStakingType" }), [
        stakingBalance,
      ]);

      expect(result.errors.type?.name).toBe("MultiversXUnsupportedStakingType");
    });

    it("rejects a staking intent with a non-native asset", async () => {
      const result = await validateIntent(
        makeStakingIntent({ asset: { type: "esdt", assetReference: "USDC-abc123" } }),
        [stakingBalance],
      );

      expect(result.errors.asset?.name).toBe("MultiversXUnsupportedAssetType");
    });

    it("rejects a staking recipient that is not a validator contract", async () => {
      const result = await validateIntent(makeStakingIntent({ recipient: VALID_RECIPIENT }), [
        stakingBalance,
      ]);

      expect(result.errors.recipient?.name).toBe("MultiversXStakingRecipientNotValidator");
    });

    it("detects insufficient balance for a delegate intent", async () => {
      const result = await validateIntent(makeStakingIntent({ amount: TEN_EGLD }), [
        { value: 1000000000000000000n, asset: { type: "native" } },
      ]);

      expect(result.errors.amount?.name).toBe("NotEnoughBalance");
    });

    it("routes staking-typed intents the framework tags as transaction through staking validation", async () => {
      const valid = await validateIntent(
        makeStakingIntent({ intentType: "transaction", type: "unDelegate", amount: 0n }),
        [stakingBalance],
      );
      expect(Object.keys(valid.errors)).toHaveLength(0);

      const invalidRecipient = await validateIntent(
        makeStakingIntent({
          intentType: "transaction",
          type: "unDelegate",
          amount: 0n,
          recipient: VALID_RECIPIENT,
        }),
        [stakingBalance],
      );
      expect(invalidRecipient.errors.recipient?.name).toBe(
        "MultiversXStakingRecipientNotValidator",
      );
    });

    it("spends the full balance minus fees for a max delegate intent", async () => {
      const fees: FeeEstimation = { value: 50000000000000n };
      const result = await validateIntent(
        makeStakingIntent({ amount: 0n, useAllAmount: true }),
        [stakingBalance],
        fees,
      );

      expect(Object.keys(result.errors)).toHaveLength(0);
      expect(result.amount).toBe(stakingBalance.value - fees.value);
      expect(result.totalSpent).toBe(stakingBalance.value);
    });
  });
});
