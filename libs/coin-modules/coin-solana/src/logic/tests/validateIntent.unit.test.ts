import type {
  Balance,
  StakingTransactionIntent,
  TransactionIntent,
} from "@ledgerhq/coin-module-framework/api/types";
import {
  AmountRequired,
  FeeTooHigh,
  InvalidAddress,
  InvalidAddressBecauseDestinationIsAlsoSource,
  NotEnoughBalance,
  NotEnoughGas,
  RecipientRequired,
} from "@ledgerhq/errors";
import { SolanaStakeAccountAmountTooLow } from "../../errors";
import type { ChainAPI } from "../../network";
import { getMaybeTokenMint } from "../../network/chain/web3";
import { validateIntent as validateIntentRaw } from "../validateIntent";

const SENDER = "HxCvgjSbF8HMt3fj8P3j49jmajNCMwKAqBu79HUDPtkM";
const RECIPIENT = "7VHUFJHWu2CuExkJcJrzhQPJ2oygupTWkL2A2For4BmE";

const STAKE_ACC_RENT_EXEMPT = 2_282_880;

jest.mock("../../network/chain/web3", () => ({
  __esModule: true,
  getMaybeTokenMint: jest.fn(),
  getStakeAccountMinimumBalanceForRentExemption: jest.fn((api: ChainAPI) =>
    api.getMinimumBalanceForRentExemption(200),
  ),
}));
const mockedGetMaybeTokenMint = getMaybeTokenMint as jest.MockedFunction<typeof getMaybeTokenMint>;
function makeApi(
  stakeMinimumDelegation = 1_000_000_000,
  stakeAccRentExempt: number = STAKE_ACC_RENT_EXEMPT,
): ChainAPI {
  return {
    getStakeMinimumDelegation: jest.fn().mockResolvedValue(stakeMinimumDelegation),
    getMinimumBalanceForRentExemption: jest.fn().mockResolvedValue(stakeAccRentExempt),
  } as unknown as ChainAPI;
}

type IntentArg = Parameters<typeof validateIntentRaw>[1];
type BalancesArg = Parameters<typeof validateIntentRaw>[2];
type FeesArg = Parameters<typeof validateIntentRaw>[3];

const validateIntent = (
  intent: IntentArg,
  balances: BalancesArg,
  customFees?: FeesArg,
  api?: ChainAPI,
): ReturnType<typeof validateIntentRaw> => {
  const resolvedApi =
    api ?? (intent.intentType === "staking" ? makeApi() : (undefined as unknown as ChainAPI));
  return validateIntentRaw(resolvedApi, intent, balances, customFees);
};

function makeIntent(overrides?: Partial<TransactionIntent>): TransactionIntent {
  return {
    intentType: "transaction",
    type: "send",
    sender: SENDER,
    recipient: RECIPIENT,
    amount: 1_000_000_000n,
    asset: { type: "native", name: "Solana" },
    ...overrides,
  };
}

function makeBalances(native = 5_000_000_000n, locked = 890_880n): Balance[] {
  return [{ value: native, asset: { type: "native" }, locked }];
}

describe("validateIntent", () => {
  afterEach(() => jest.clearAllMocks());

  it("should return valid result for a basic native transfer", async () => {
    const result = await validateIntent(makeIntent(), makeBalances(), { value: 5000n });

    expect(result.errors).toEqual({});
    expect(result.warnings).toEqual({});
    expect(result.amount).toBe(1_000_000_000n);
    expect(result.estimatedFees).toBe(5000n);
    expect(result.totalSpent).toBe(1_000_000_000n + 5000n);
  });

  it("should error when recipient is missing", async () => {
    const result = await validateIntent(makeIntent({ recipient: "" }), makeBalances(), {
      value: 5000n,
    });

    expect(result.errors.recipient).toBeInstanceOf(RecipientRequired);
  });

  it("should error when recipient is the sender", async () => {
    const result = await validateIntent(makeIntent({ recipient: SENDER }), makeBalances(), {
      value: 5000n,
    });

    expect(result.errors.recipient).toBeInstanceOf(InvalidAddressBecauseDestinationIsAlsoSource);
  });

  it("should error when recipient is an invalid address", async () => {
    const result = await validateIntent(
      makeIntent({ recipient: "not-a-valid-address!!!" }),
      makeBalances(),
      { value: 5000n },
    );

    expect(result.errors.recipient).toBeInstanceOf(InvalidAddress);
  });

  it("should error when amount is zero and not useAllAmount", async () => {
    const result = await validateIntent(makeIntent({ amount: 0n }), makeBalances(), {
      value: 5000n,
    });

    expect(result.errors.amount).toBeInstanceOf(AmountRequired);
  });

  it("should error when amount exceeds spendable balance (native)", async () => {
    const result = await validateIntent(
      makeIntent({ amount: 10_000_000_000n }),
      makeBalances(5_000_000_000n, 890_880n),
      { value: 5000n },
    );

    expect(result.errors.amount).toBeInstanceOf(NotEnoughBalance);
  });

  it("should warn when fee is too high relative to amount", async () => {
    const result = await validateIntent(makeIntent({ amount: 100n }), makeBalances(), {
      value: 5000n,
    });

    expect(result.warnings.feeTooHigh).toBeInstanceOf(FeeTooHigh);
  });

  it("should compute amount for useAllAmount (native)", async () => {
    const result = await validateIntent(
      makeIntent({ amount: 0n, useAllAmount: true }),
      makeBalances(2_000_000_000n, 890_880n),
      { value: 5000n },
    );

    expect(result.errors).toEqual({});
    const expectedAmount = 2_000_000_000n - 890_880n - 5000n;
    expect(result.amount).toBe(expectedAmount);
    expect(result.totalSpent).toBe(expectedAmount + 5000n);
  });

  it("should return zero amount when useAllAmount and balance insufficient for fees", async () => {
    const result = await validateIntent(
      makeIntent({ amount: 0n, useAllAmount: true }),
      makeBalances(5000n, 0n),
      { value: 10_000n },
    );

    expect(result.amount).toBe(0n);
  });

  it("should default estimatedFees to 0n when no customFees provided", async () => {
    const result = await validateIntent(makeIntent(), makeBalances());

    expect(result.estimatedFees).toBe(0n);
    expect(result.totalSpent).toBe(1_000_000_000n);
  });

  describe("staking intents", () => {
    describe("stake.createAccount", () => {
      function makeStakeIntent(
        overrides?: Partial<StakingTransactionIntent>,
      ): StakingTransactionIntent {
        return {
          intentType: "staking",
          type: "stake.createAccount",
          mode: "delegate",
          sender: SENDER,
          recipient: RECIPIENT,
          valAddress: RECIPIENT,
          amount: 1_000_000_000n,
          asset: { type: "native", name: "Solana" },
          ...overrides,
        };
      }

      it("should validate a correct stake.createAccount intent", async () => {
        const result = await validateIntent(makeStakeIntent(), makeBalances(), { value: 5000n });

        expect(result.errors).toEqual({});
        expect(result.amount).toBe(1_000_000_000n);
        expect(result.totalSpent).toBe(1_000_000_000n + 5000n);
      });

      it("should error when recipient is missing", async () => {
        const result = await validateIntent(makeStakeIntent({ recipient: "" }), makeBalances(), {
          value: 5000n,
        });

        expect(result.errors.recipient).toBeInstanceOf(RecipientRequired);
      });

      it("should error when recipient is an invalid address", async () => {
        const result = await validateIntent(
          makeStakeIntent({ recipient: "not-valid!!!" }),
          makeBalances(),
          { value: 5000n },
        );

        expect(result.errors.recipient).toBeInstanceOf(InvalidAddress);
      });

      it("should error when amount is zero", async () => {
        const result = await validateIntent(makeStakeIntent({ amount: 0n }), makeBalances(), {
          value: 5000n,
        });

        expect(result.errors.amount).toBeInstanceOf(AmountRequired);
      });

      it("should error when amount + fees exceed available balance", async () => {
        const result = await validateIntent(
          makeStakeIntent({ amount: 5_000_000_000n }),
          makeBalances(5_000_000_000n, 890_880n),
          { value: 5000n },
        );

        expect(result.errors.amount).toBeInstanceOf(NotEnoughBalance);
      });

      it("should compute max amount for useAllAmount", async () => {
        const result = await validateIntent(
          makeStakeIntent({ amount: 0n, useAllAmount: true }),
          makeBalances(2_000_000_000n, 890_880n),
          { value: 5000n },
        );

        expect(result.errors).toEqual({});
        expect(result.amount).toBe(2_000_000_000n - 890_880n - 5000n);
      });

      it("should clamp amount to 0 when useAllAmount and balance is insufficient", async () => {
        const result = await validateIntent(
          makeStakeIntent({ amount: 0n, useAllAmount: true }),
          makeBalances(1000n, 0n),
          { value: 5000n },
        );

        expect(result.amount).toBe(0n);
      });

      it("should error when amount is below the stake minimum delegation", async () => {
        const result = await validateIntentRaw(
          makeApi(1_000_000_000),
          makeStakeIntent({ amount: 999_999_999n }),
          makeBalances(5_000_000_000n, 0n),
          { value: 5000n },
        );

        expect(result.errors.amount).toBeInstanceOf(SolanaStakeAccountAmountTooLow);
        expect(
          (result.errors.amount as Error & { minimumAmount?: string })?.minimumAmount,
        ).toBe("1 SOL");
      });

      it("should error when useAllAmount yields a value below the stake minimum delegation", async () => {
        const result = await validateIntentRaw(
          makeApi(1_000_000_000),
          makeStakeIntent({ amount: 0n, useAllAmount: true }),
          makeBalances(500_000_000n, 0n),
          { value: 5000n },
        );

        expect(result.errors.amount).toBeInstanceOf(SolanaStakeAccountAmountTooLow);
      });

      it("should error when useAllAmount minus rent-exempt drops below the stake minimum delegation", async () => {
        const result = await validateIntentRaw(
          makeApi(1_000_000_000, STAKE_ACC_RENT_EXEMPT),
          makeStakeIntent({ amount: 0n, useAllAmount: true }),
          makeBalances(1_000_500_000n, 0n),
          { value: 5000n },
        );

        expect(result.errors.amount).toBeInstanceOf(SolanaStakeAccountAmountTooLow);
      });

      it("should pass when amount is at or above the stake minimum delegation", async () => {
        const result = await validateIntentRaw(
          makeApi(1_000_000_000),
          makeStakeIntent({ amount: 1_000_000_000n }),
          makeBalances(5_000_000_000n, 0n),
          { value: 5000n },
        );

        expect(result.errors).toEqual({});
      });

      it("should fetch the minimum delegation from the chain api", async () => {
        const api = makeApi(2_500_000_000);
        const result = await validateIntentRaw(
          api,
          makeStakeIntent({ amount: 2_000_000_000n }),
          makeBalances(5_000_000_000n, 0n),
          { value: 5000n },
        );

        expect(api.getStakeMinimumDelegation).toHaveBeenCalledTimes(1);
        expect(result.errors.amount).toBeInstanceOf(SolanaStakeAccountAmountTooLow);
      });

      it("should skip getStakeMinimumDelegation when recipient is missing", async () => {
        const api = makeApi(1_000_000_000);
        const result = await validateIntentRaw(
          api,
          makeStakeIntent({ recipient: "" }),
          makeBalances(5_000_000_000n, 0n),
          { value: 5000n },
        );

        expect(result.errors.recipient).toBeInstanceOf(RecipientRequired);
        expect(api.getStakeMinimumDelegation).not.toHaveBeenCalled();
      });

      it("should skip getStakeMinimumDelegation when recipient is invalid", async () => {
        const api = makeApi(1_000_000_000);
        const result = await validateIntentRaw(
          api,
          makeStakeIntent({ recipient: "not-valid!!!" }),
          makeBalances(5_000_000_000n, 0n),
          { value: 5000n },
        );

        expect(result.errors.recipient).toBeInstanceOf(InvalidAddress);
        expect(api.getStakeMinimumDelegation).not.toHaveBeenCalled();
      });

      it("should skip getStakeMinimumDelegation when useAllAmount with missing recipient", async () => {
        const api = makeApi(1_000_000_000);
        const result = await validateIntentRaw(
          api,
          makeStakeIntent({ recipient: "", amount: 0n, useAllAmount: true }),
          makeBalances(5_000_000_000n, 890_880n),
          { value: 5000n },
        );

        expect(result.errors.recipient).toBeInstanceOf(RecipientRequired);
        expect(api.getStakeMinimumDelegation).not.toHaveBeenCalled();
      });

      it("should return validation errors instead of rejecting when getStakeMinimumDelegation would fail and recipient is invalid", async () => {
        const api = {
          getStakeMinimumDelegation: jest
            .fn()
            .mockRejectedValue(new Error("RPC unreachable")),
        } as unknown as ChainAPI;

        await expect(
          validateIntentRaw(
            api,
            makeStakeIntent({ recipient: "not-valid!!!" }),
            makeBalances(5_000_000_000n, 0n),
            { value: 5000n },
          ),
        ).resolves.toMatchObject({
          errors: { recipient: expect.any(InvalidAddress) },
        });
        expect(api.getStakeMinimumDelegation).not.toHaveBeenCalled();
      });

      it("skips the minimum-delegation check when the RPC call fails (best-effort)", async () => {
        const api = {
          getStakeMinimumDelegation: jest
            .fn()
            .mockRejectedValue(new Error("RPC unreachable")),
        } as unknown as ChainAPI;

        const result = await validateIntentRaw(
          api,
          makeStakeIntent({ amount: 1n }),
          makeBalances(5_000_000_000n, 0n),
          { value: 5000n },
        );

        expect(api.getStakeMinimumDelegation).toHaveBeenCalledTimes(1);
        expect(result.errors).toEqual({});
      });
    });

    describe("stake.delegate", () => {
      function makeDelegateIntent(
        overrides?: Partial<StakingTransactionIntent>,
      ): StakingTransactionIntent {
        return {
          intentType: "staking",
          type: "stake.delegate",
          mode: "delegate",
          sender: SENDER,
          recipient: RECIPIENT,
          valAddress: RECIPIENT,
          amount: 0n,
          asset: { type: "native", name: "Solana" },
          ...overrides,
        };
      }

      it("should set amount to 0 and totalSpent to fees", async () => {
        const result = await validateIntent(makeDelegateIntent(), makeBalances(), { value: 5000n });

        expect(result.errors).toEqual({});
        expect(result.amount).toBe(0n);
        expect(result.totalSpent).toBe(5000n);
      });

      it("should error when fees exceed available balance (value - locked)", async () => {
        const result = await validateIntent(makeDelegateIntent(), makeBalances(10_000n, 8_000n), {
          value: 5000n,
        });

        expect(result.errors.amount).toBeInstanceOf(NotEnoughBalance);
      });
    });

    describe("stake.undelegate", () => {
      function makeUndelegateIntent(
        overrides?: Partial<StakingTransactionIntent>,
      ): StakingTransactionIntent {
        return {
          intentType: "staking",
          type: "stake.undelegate",
          mode: "undelegate",
          sender: SENDER,
          recipient: RECIPIENT,
          valAddress: "",
          amount: 0n,
          asset: { type: "native", name: "Solana" },
          ...overrides,
        };
      }

      it("should set amount to 0 and totalSpent to fees", async () => {
        const result = await validateIntent(makeUndelegateIntent(), makeBalances(), {
          value: 5000n,
        });

        expect(result.errors).toEqual({});
        expect(result.amount).toBe(0n);
        expect(result.totalSpent).toBe(5000n);
      });

      it("should error when fees exceed total native value (not available)", async () => {
        const result = await validateIntent(makeUndelegateIntent(), makeBalances(3000n, 0n), {
          value: 5000n,
        });

        expect(result.errors.amount).toBeInstanceOf(NotEnoughBalance);
      });
    });

    describe("stake.withdraw", () => {
      function makeWithdrawIntent(overrides?: Partial<TransactionIntent>): TransactionIntent {
        return {
          intentType: "transaction",
          type: "stake.withdraw",
          sender: SENDER,
          recipient: RECIPIENT,
          amount: 2_000_000_000n,
          asset: { type: "native", name: "Solana" },
          ...overrides,
        };
      }

      it("should use the provided amount", async () => {
        const result = await validateIntent(makeWithdrawIntent(), makeBalances(), { value: 5000n });

        expect(result.errors).toEqual({});
        expect(result.amount).toBe(2_000_000_000n);
        expect(result.totalSpent).toBe(5000n);
      });

      it("should clamp to 0 when amount is 0", async () => {
        const result = await validateIntent(
          makeWithdrawIntent({ useAllAmount: true, amount: 0n }),
          makeBalances(),
          { value: 5000n },
        );

        expect(result.amount).toBe(0n);
      });

      it("should clamp negative amount to 0", async () => {
        const result = await validateIntent(
          makeWithdrawIntent({ amount: -1_000n }),
          makeBalances(),
          { value: 5000n },
        );

        expect(result.amount).toBe(0n);
      });

      it("should error when fees exceed total native value", async () => {
        const result = await validateIntent(makeWithdrawIntent(), makeBalances(3000n, 0n), {
          value: 5000n,
        });

        expect(result.errors.amount).toBeInstanceOf(NotEnoughBalance);
      });
    });
  });

  describe("token transfers", () => {
    const USDC_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";

    function makeTokenIntent(overrides?: Partial<TransactionIntent>): TransactionIntent {
      return makeIntent({
        asset: { type: "spl-token", assetReference: USDC_MINT, name: "USDC" },
        ...overrides,
      });
    }

    function makeTokenBalances(): Balance[] {
      return [
        { value: 5_000_000_000n, asset: { type: "native" }, locked: 890_880n },
        { value: 10_000_000n, asset: { type: "spl-token", assetReference: USDC_MINT } },
      ];
    }

    it("should validate a basic token transfer", async () => {
      const result = await validateIntent(
        makeTokenIntent({ amount: 1_000_000n }),
        makeTokenBalances(),
        { value: 5000n },
      );

      expect(result.errors).toEqual({});
      expect(result.amount).toBe(1_000_000n);
      expect(result.totalSpent).toBe(1_000_000n);
    });

    it("should error when token amount exceeds balance", async () => {
      const result = await validateIntent(
        makeTokenIntent({ amount: 50_000_000n }),
        makeTokenBalances(),
        { value: 5000n },
      );

      expect(result.errors.amount).toBeInstanceOf(NotEnoughBalance);
    });

    it("should compute amount for useAllAmount (token)", async () => {
      const result = await validateIntent(
        makeTokenIntent({ amount: 0n, useAllAmount: true }),
        makeTokenBalances(),
        { value: 5000n },
      );

      expect(result.amount).toBe(10_000_000n);
      expect(result.totalSpent).toBe(10_000_000n);
    });

    it("should default to 0 when useAllAmount and token not found in balances", async () => {
      const result = await validateIntent(
        makeTokenIntent({ amount: 0n, useAllAmount: true }),
        makeBalances(),
        { value: 5000n },
      );

      expect(result.amount).toBe(0n);
    });

    describe("native SOL coverage for ATA rent + fee (via api)", () => {
      const FEE = 5000n;
      const CLASSIC_ATA_RENT = 2_039_280n;
      const TOKEN_2022_ATA_RENT_WITH_TRANSFER_FEE = 2_157_600n;

      function makeFakeApi(opts: {
        ataExists: boolean;
        rentLamports?: number;
        rentByDataLength?: Record<number, number>;
      }): ChainAPI {
        return {
          findAssocTokenAccAddress: jest.fn(async () => "FakeAtaAddress"),
          getBalance: jest.fn(async () => (opts.ataExists ? 1n : 0n)),
          getMinimumBalanceForRentExemption: jest.fn(async (dataLength: number) => {
            if (opts.rentByDataLength && dataLength in opts.rentByDataLength) {
              return opts.rentByDataLength[dataLength];
            }
            if (opts.rentLamports !== undefined) return opts.rentLamports;
            throw new Error(`unexpected dataLength ${dataLength} in test`);
          }),
        } as unknown as ChainAPI;
      }

      function makeMint(program: "spl-token" | "spl-token-2022", extensions: string[] = []) {
        return {
          onChainAcc: { data: { program } },
          info: { extensions: extensions.map(extension => ({ extension })) },
        } as Awaited<ReturnType<typeof getMaybeTokenMint>>;
      }

      function balancesWithNative(nativeValue: bigint, locked: bigint = 890_880n): Balance[] {
        return [
          { value: nativeValue, asset: { type: "native" }, locked },
          { value: 10_000_000n, asset: { type: "spl-token", assetReference: USDC_MINT } },
        ];
      }

      beforeEach(() => {
        mockedGetMaybeTokenMint.mockReset();
      });

      it("packs NotEnoughGas when spendable equals classic ATA rent + fee but the Token-2022 ATA needs more SOL", async () => {
        mockedGetMaybeTokenMint.mockResolvedValueOnce(
          makeMint("spl-token-2022", ["transferFeeConfig"]),
        );
        const api = makeFakeApi({
          ataExists: false,
          rentLamports: Number(TOKEN_2022_ATA_RENT_WITH_TRANSFER_FEE),
        });

        const result = await validateIntent(
          makeTokenIntent({ amount: 1n }),
          balancesWithNative(2_935_160n),
          { value: FEE },
          api,
        );

        expect(result.errors.gasPrice).toBeInstanceOf(NotEnoughGas);
        expect((result.errors.gasPrice as Error & { fees?: string }).fees).toBe(
          (TOKEN_2022_ATA_RENT_WITH_TRANSFER_FEE + FEE).toString(),
        );
      });

      it("does not pack NotEnoughGas when spendable covers mint-aware ATA rent + fee", async () => {
        mockedGetMaybeTokenMint.mockResolvedValueOnce(
          makeMint("spl-token-2022", ["transferFeeConfig"]),
        );
        const api = makeFakeApi({
          ataExists: false,
          rentLamports: Number(TOKEN_2022_ATA_RENT_WITH_TRANSFER_FEE),
        });

        const result = await validateIntent(
          makeTokenIntent({ amount: 1n }),
          balancesWithNative(TOKEN_2022_ATA_RENT_WITH_TRANSFER_FEE + FEE + 890_880n),
          { value: FEE },
          api,
        );

        expect(result.errors.gasPrice).toBeUndefined();
      });

      it("packs NotEnoughGas when classic SPL ATA needs to be created and spendable can't cover rent + fee", async () => {
        mockedGetMaybeTokenMint.mockResolvedValueOnce(makeMint("spl-token"));
        const api = makeFakeApi({
          ataExists: false,
          rentLamports: Number(CLASSIC_ATA_RENT),
        });

        const result = await validateIntent(
          makeTokenIntent({ amount: 1n }),
          balancesWithNative(CLASSIC_ATA_RENT + FEE - 1n + 890_880n),
          { value: FEE },
          api,
        );

        expect(result.errors.gasPrice).toBeInstanceOf(NotEnoughGas);
      });

      it("does not require ATA rent when the recipient's ATA already exists", async () => {
        mockedGetMaybeTokenMint.mockResolvedValueOnce(makeMint("spl-token"));
        const api = makeFakeApi({
          ataExists: true,
          rentByDataLength: {},
        });

        const result = await validateIntent(
          makeTokenIntent({ amount: 1n }),
          balancesWithNative(FEE + 890_880n),
          { value: FEE },
          api,
        );

        expect(result.errors.gasPrice).toBeUndefined();
        expect(api.getMinimumBalanceForRentExemption).not.toHaveBeenCalled();
      });

      it("packs NotEnoughGas when spendable is zero, regardless of fee value", async () => {
        mockedGetMaybeTokenMint.mockResolvedValueOnce(makeMint("spl-token"));
        const api = makeFakeApi({
          ataExists: true,
          rentByDataLength: {},
        });

        const result = await validateIntent(
          makeTokenIntent({ amount: 1n }),
          balancesWithNative(890_880n),
          { value: 0n },
          api,
        );

        expect(result.errors.gasPrice).toBeInstanceOf(NotEnoughGas);
      });

      it("skips the native coverage check when api is not provided (back-compat)", async () => {
        const result = await validateIntent(
          makeTokenIntent({ amount: 1n }),
          balancesWithNative(0n),
          { value: FEE },
        );

        expect(result.errors.gasPrice).toBeUndefined();
        expect(mockedGetMaybeTokenMint).not.toHaveBeenCalled();
      });

      it("skips the native coverage check when recipient address is invalid", async () => {
        const result = await validateIntent(
          makeTokenIntent({ amount: 1n, recipient: "not-a-valid-address" }),
          balancesWithNative(0n),
          { value: FEE },
          makeFakeApi({ ataExists: false, rentByDataLength: {} }),
        );

        expect(result.errors.recipient).toBeInstanceOf(InvalidAddress);
        expect(result.errors.gasPrice).toBeUndefined();
        expect(mockedGetMaybeTokenMint).not.toHaveBeenCalled();
      });

      it("bails out silently when getMaybeTokenMint returns an Error (no gasPrice noise)", async () => {
        mockedGetMaybeTokenMint.mockResolvedValueOnce(new Error("network failed") as any);
        const api = makeFakeApi({ ataExists: false, rentByDataLength: {} });

        const result = await validateIntent(
          makeTokenIntent({ amount: 1n }),
          balancesWithNative(0n),
          { value: FEE },
          api,
        );

        expect(result.errors.gasPrice).toBeUndefined();
      });
    });
  });
});
