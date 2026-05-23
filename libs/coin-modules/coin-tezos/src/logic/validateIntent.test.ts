import type { TransactionIntent } from "@ledgerhq/coin-module-framework/api/types";
import {
  RecipientRequired,
  InvalidAddress,
  InvalidAddressBecauseDestinationIsAlsoSource,
  AmountRequired,
  NotEnoughBalance,
  RecommendUndelegation,
  NotEnoughBalanceToDelegate,
} from "@ledgerhq/errors";
import coinConfig from "../config";
import { InvalidAddressBecauseAlreadyDelegated, MustDelegateBeforeStaking } from "../types/errors";
import { validateIntent } from "./validateIntent";

const mockEstimateFees = jest.fn();
jest.mock("./estimateFees", () => ({
  estimateFees: (...args: unknown[]) => mockEstimateFees(...args),
}));

const mockGetAccountByAddress = jest.fn();
const mockGetTokensBalances = jest.fn();
const mockGetUnstakeRequestsFinalizable = jest.fn();
jest.mock("../network/tzkt", () => ({
  __esModule: true,
  default: {
    getAccountByAddress: (...args: unknown[]) => mockGetAccountByAddress(...args),
    getTokensBalances: (...args: unknown[]) => mockGetTokensBalances(...args),
    getUnstakeRequestsFinalizable: (...args: unknown[]) =>
      mockGetUnstakeRequestsFinalizable(...args),
  },
}));

describe("validateIntent", () => {
  const senderAddress = "tz1TzrmTBSuiVHV2VfMnGRMYvTEPCP42oSM8";
  const validRecipient = "tz1KqTpEZ7Yob7QbPE4Hy4Wo8fHG8LhKxZSx";

  const makeUserAccount = (overrides: Record<string, unknown> = {}) => ({
    type: "user" as const,
    address: senderAddress,
    publicKey: "edpk...",
    balance: 5000000,
    revealed: true,
    counter: 0,
    delegationLevel: 0,
    delegationTime: "2021-01-01T00:00:00Z",
    numTransactions: 0,
    firstActivityTime: "2021-01-01T00:00:00Z",
    ...overrides,
  });

  beforeEach(() => {
    jest.clearAllMocks();

    coinConfig.setCoinConfig(() => ({
      status: { type: "active" },
      baker: { url: "http://baker.example.com" },
      explorer: { url: "http://tezos.explorer.com", maxTxQuery: 100 },
      node: { url: "http://tezos.node.com" },
      fees: {
        minGasLimit: 600,
        minRevealGasLimit: 300,
        minStorageLimit: 0,
        minFees: 500,
        minEstimatedFees: 500,
      },
    }));

    mockEstimateFees.mockResolvedValue({
      fees: 1000n,
      gasLimit: 10000n,
      storageLimit: 0n,
      estimatedFees: 1000n,
    });

    mockGetAccountByAddress.mockResolvedValue(makeUserAccount());
    mockGetTokensBalances.mockResolvedValue([]);
    mockGetUnstakeRequestsFinalizable.mockResolvedValue(0n);
  });

  describe("recipient validation", () => {
    it("should return RecipientRequired error when recipient is missing", async () => {
      const result = await validateIntent({
        intentType: "transaction",
        asset: { type: "native" },
        type: "send",
        sender: senderAddress,
        recipient: "",
        amount: 1000n,
      });

      expect(result.errors.recipient).toBeInstanceOf(RecipientRequired);
    });

    it("should return InvalidAddress error for invalid recipient", async () => {
      const result = await validateIntent({
        intentType: "transaction",
        asset: { type: "native" },
        type: "send",
        sender: senderAddress,
        recipient: "invalid_address",
        amount: 1000n,
      });

      expect(result.errors.recipient).toBeInstanceOf(InvalidAddress);
    });

    it("should return InvalidAddressBecauseDestinationIsAlsoSource when sender equals recipient", async () => {
      const result = await validateIntent({
        intentType: "transaction",
        asset: { type: "native" },
        type: "send",
        sender: senderAddress,
        recipient: senderAddress,
        amount: 1000n,
      });

      expect(result.errors.recipient).toBeInstanceOf(InvalidAddressBecauseDestinationIsAlsoSource);
    });
  });

  describe("amount validation", () => {
    it("should return AmountRequired error when amount is zero and not useAllAmount", async () => {
      const result = await validateIntent({
        intentType: "transaction",
        asset: { type: "native" },
        type: "send",
        sender: senderAddress,
        recipient: validRecipient,
        amount: 0n,
        useAllAmount: false,
      });

      expect(result.errors.amount).toBeInstanceOf(AmountRequired);
    });

    it("should not return AmountRequired error when useAllAmount is true", async () => {
      const result = await validateIntent({
        intentType: "transaction",
        asset: { type: "native" },
        type: "send",
        sender: senderAddress,
        recipient: validRecipient,
        amount: 0n,
        useAllAmount: true,
      });

      expect(result.errors.amount).toBeUndefined();
    });

    it("should return NotEnoughBalance when amount is negative", async () => {
      const result = await validateIntent({
        intentType: "transaction",
        asset: { type: "native" },
        type: "send",
        sender: senderAddress,
        recipient: validRecipient,
        amount: -1n,
      });

      expect(result.errors.amount).toBeInstanceOf(NotEnoughBalance);
    });

    it("uses the staked amount as amount and amount + fees as totalSpent for stake", async () => {
      mockGetAccountByAddress.mockResolvedValue(
        makeUserAccount({
          delegate: { alias: "baker", address: validRecipient, active: true },
          delegationLevel: 1,
        }),
      );

      const result = await validateIntent({
        intentType: "staking",
        asset: { type: "native" },
        type: "stake",
        sender: senderAddress,
        recipient: "",
        amount: 2500n,
      });

      expect(result).toEqual({
        errors: {},
        warnings: {},
        estimatedFees: 1000n,
        amount: 2500n,
        totalSpent: 3500n,
      });
    });

    it("uses only fees as totalSpent for unstake", async () => {
      mockGetAccountByAddress.mockResolvedValue(makeUserAccount({ stakedBalance: 4000 }));

      const result = await validateIntent({
        intentType: "staking",
        asset: { type: "native" },
        type: "unstake",
        sender: senderAddress,
        recipient: "",
        amount: 2500n,
      });

      expect(result).toEqual({
        errors: {},
        warnings: {},
        estimatedFees: 1000n,
        amount: 2500n,
        totalSpent: 1000n,
      });
    });

    it("uses amount 0 and only fees as totalSpent for finalize_unstake", async () => {
      mockGetUnstakeRequestsFinalizable.mockResolvedValue(1234n);

      const result = await validateIntent({
        intentType: "staking",
        asset: { type: "native" },
        type: "finalize_unstake",
        sender: senderAddress,
        recipient: "",
        amount: 0n,
      } satisfies TransactionIntent);

      expect(result).toEqual({
        errors: {},
        warnings: {},
        estimatedFees: 1000n,
        amount: 0n,
        totalSpent: 1000n,
      });
    });
  });

  describe("transaction constraints", () => {
    it("should return RecommendUndelegation when send-max native XTZ on a delegated account", async () => {
      mockGetAccountByAddress.mockResolvedValue(
        makeUserAccount({
          delegate: { alias: "baker", address: validRecipient, active: true },
          delegationLevel: 1,
        }),
      );

      const result = await validateIntent({
        intentType: "transaction",
        asset: { type: "native" },
        type: "send",
        sender: senderAddress,
        recipient: validRecipient,
        amount: 0n,
        useAllAmount: true,
      });

      expect(result.errors.amount).toBeInstanceOf(RecommendUndelegation);
      expect(mockEstimateFees).not.toHaveBeenCalled();
    });

    it("should return MustDelegateBeforeStaking when stake intent has no delegate", async () => {
      const result = await validateIntent({
        intentType: "staking",
        asset: { type: "native" },
        type: "stake",
        sender: senderAddress,
        recipient: "",
        amount: 1n,
      });

      expect(result.errors.amount).toBeInstanceOf(MustDelegateBeforeStaking);
      expect(mockEstimateFees).not.toHaveBeenCalled();
    });

    it("should return AmountRequired when stake amount is zero", async () => {
      mockGetAccountByAddress.mockResolvedValue(
        makeUserAccount({
          delegate: { alias: "baker", address: validRecipient, active: true },
          delegationLevel: 1,
        }),
      );

      const result = await validateIntent({
        intentType: "staking",
        asset: { type: "native" },
        type: "stake",
        sender: senderAddress,
        recipient: "",
        amount: 0n,
      });

      expect(result.errors.amount).toBeInstanceOf(AmountRequired);
      expect(mockEstimateFees).not.toHaveBeenCalled();
    });

    it("should skip AmountRequired and resolve max amount when stake useAllAmount is true", async () => {
      mockGetAccountByAddress.mockResolvedValue(
        makeUserAccount({
          delegate: { alias: "baker", address: validRecipient, active: true },
          delegationLevel: 1,
        }),
      );
      mockEstimateFees.mockResolvedValueOnce({
        fees: 1000n,
        gasLimit: 10000n,
        storageLimit: 0n,
        estimatedFees: 1000n,
        amount: 4_500_000n,
      });

      const result = await validateIntent({
        intentType: "staking",
        asset: { type: "native" },
        type: "stake",
        sender: senderAddress,
        recipient: "",
        amount: 0n,
        useAllAmount: true,
      });

      expect(result.errors.amount).toBeUndefined();
      expect(mockEstimateFees).toHaveBeenCalledTimes(1);
      expect(result.amount).toBe(4_500_000n);
    });

    it("should return NotEnoughBalanceToDelegate when stake useAllAmount resolves max to 0n", async () => {
      mockGetAccountByAddress.mockResolvedValue(
        makeUserAccount({
          delegate: { alias: "baker", address: validRecipient, active: true },
          delegationLevel: 1,
        }),
      );
      mockEstimateFees.mockResolvedValueOnce({
        fees: 1000n,
        gasLimit: 10000n,
        storageLimit: 0n,
        estimatedFees: 1000n,
        amount: 0n,
      });

      const result = await validateIntent({
        intentType: "staking",
        asset: { type: "native" },
        type: "stake",
        sender: senderAddress,
        recipient: "",
        amount: 0n,
        useAllAmount: true,
      });

      expect(result.errors.amount).toBeInstanceOf(NotEnoughBalanceToDelegate);
      expect(result.amount).toBe(0n);
    });

    it("should return NotEnoughBalance when unstake has no staked balance", async () => {
      mockGetAccountByAddress.mockResolvedValue(makeUserAccount({ stakedBalance: 0 }));

      const result = await validateIntent({
        intentType: "staking",
        asset: { type: "native" },
        type: "unstake",
        sender: senderAddress,
        recipient: "",
        amount: 1n,
      });

      expect(result.errors.amount).toBeInstanceOf(NotEnoughBalance);
      expect(mockEstimateFees).not.toHaveBeenCalled();
    });

    it("should return AmountRequired when unstake amount is zero", async () => {
      mockGetAccountByAddress.mockResolvedValue(makeUserAccount({ stakedBalance: 4000 }));

      const result = await validateIntent({
        intentType: "staking",
        asset: { type: "native" },
        type: "unstake",
        sender: senderAddress,
        recipient: "",
        amount: 0n,
      });

      expect(result.errors.amount).toBeInstanceOf(AmountRequired);
      expect(mockEstimateFees).not.toHaveBeenCalled();
    });

    it("should return NotEnoughBalance when unstake amount exceeds staked balance", async () => {
      mockGetAccountByAddress.mockResolvedValue(makeUserAccount({ stakedBalance: 4000 }));

      const result = await validateIntent({
        intentType: "staking",
        asset: { type: "native" },
        type: "unstake",
        sender: senderAddress,
        recipient: "",
        amount: 5000n,
      });

      expect(result.errors.amount).toBeInstanceOf(NotEnoughBalance);
      expect(mockEstimateFees).not.toHaveBeenCalled();
    });

    it("should return NotEnoughBalance when finalize_unstake has nothing finalizable", async () => {
      mockGetUnstakeRequestsFinalizable.mockResolvedValue(0n);

      const result = await validateIntent({
        intentType: "staking",
        asset: { type: "native" },
        type: "finalize_unstake",
        sender: senderAddress,
        recipient: "",
        amount: 0n,
      } satisfies TransactionIntent);

      expect(result.errors.amount).toBeInstanceOf(NotEnoughBalance);
      expect(mockEstimateFees).not.toHaveBeenCalled();
    });
  });

  describe("balance validation", () => {
    it("should return NotEnoughBalance error when amount exceeds balance", async () => {
      const balance = 1000000;
      const amount = 2000000;

      mockGetAccountByAddress.mockResolvedValue(makeUserAccount({ balance }));

      const result = await validateIntent({
        intentType: "transaction",
        asset: { type: "native" },
        type: "send",
        sender: senderAddress,
        recipient: validRecipient,
        amount: BigInt(amount),
      });

      expect(result.errors.amount).toBeInstanceOf(NotEnoughBalance);
    });

    it("should pass validation when amount is within balance", async () => {
      const amount = 1000000n;
      const result = await validateIntent({
        intentType: "transaction",
        asset: { type: "native" },
        type: "send",
        sender: senderAddress,
        recipient: validRecipient,
        amount,
      });

      expect(result.errors.amount).toBeUndefined();
      expect(result.amount).toBe(amount);
    });
  });

  describe("transaction types", () => {
    it("should pass validation for delegate transaction", async () => {
      const result = await validateIntent({
        intentType: "staking",
        asset: { type: "native" },
        type: "delegate",
        sender: senderAddress,
        recipient: validRecipient,
        amount: 0n,
      });

      expect(result.errors).toEqual({});
    });

    it("should pass validation for undelegate transaction", async () => {
      const result = await validateIntent({
        intentType: "staking",
        asset: { type: "native" },
        type: "undelegate",
        sender: senderAddress,
        recipient: "",
        amount: 0n,
      });

      expect(result.errors).toEqual({});
    });

    it("should pass validation for stake transaction when already delegated", async () => {
      mockGetAccountByAddress.mockResolvedValue(
        makeUserAccount({
          delegate: { alias: "baker", address: validRecipient, active: true },
          delegationLevel: 1,
        }),
      );

      const result = await validateIntent({
        intentType: "staking",
        asset: { type: "native" },
        type: "stake",
        sender: senderAddress,
        recipient: "",
        amount: 1000n,
      });

      expect(result.errors).toEqual({});
    });

    it("should pass validation for unstake transaction", async () => {
      mockGetAccountByAddress.mockResolvedValue(makeUserAccount({ stakedBalance: 4000 }));

      const result = await validateIntent({
        intentType: "staking",
        asset: { type: "native" },
        type: "unstake",
        sender: senderAddress,
        recipient: "",
        amount: 1000n,
      });

      expect(result.errors).toEqual({});
    });

    it("should pass validation for finalize_unstake transaction", async () => {
      mockGetUnstakeRequestsFinalizable.mockResolvedValue(4000n);

      const result = await validateIntent({
        intentType: "staking",
        asset: { type: "native" },
        type: "finalize_unstake",
        sender: senderAddress,
        recipient: "",
        amount: 0n,
      } satisfies TransactionIntent);

      expect(result.errors).toEqual({});
    });
  });

  describe("taquito error mapping", () => {
    it("maps balance_too_low to NotEnoughBalance for send", async () => {
      mockEstimateFees.mockResolvedValue({
        fees: 0n,
        gasLimit: 0n,
        storageLimit: 0n,
        estimatedFees: 500n,
        taquitoError: "proto.001-PtAtLas.contract.balance_too_low",
      });

      const result = await validateIntent({
        intentType: "transaction",
        asset: { type: "native" },
        type: "send",
        sender: senderAddress,
        recipient: validRecipient,
        amount: 1000n,
      });

      expect(result.errors.amount).toBeInstanceOf(NotEnoughBalance);
    });

    it("maps balance_too_low to NotEnoughBalanceToDelegate for stake", async () => {
      mockGetAccountByAddress.mockResolvedValue(
        makeUserAccount({
          delegate: { alias: "baker", address: validRecipient, active: true },
          delegationLevel: 1,
        }),
      );

      mockEstimateFees.mockResolvedValue({
        fees: 0n,
        gasLimit: 0n,
        storageLimit: 0n,
        estimatedFees: 500n,
        taquitoError: "proto.001-PtAtLas.contract.balance_too_low",
      });

      const result = await validateIntent({
        intentType: "staking",
        asset: { type: "native" },
        type: "stake",
        sender: senderAddress,
        recipient: "",
        amount: 1n,
      });

      expect(result.errors.amount).toBeInstanceOf(NotEnoughBalanceToDelegate);
    });

    it("maps subtraction_underflow to NotEnoughBalance for non-stake", async () => {
      mockEstimateFees.mockResolvedValue({
        fees: 0n,
        gasLimit: 0n,
        storageLimit: 0n,
        estimatedFees: 500n,
        taquitoError: "some.path.subtraction_underflow",
      });

      const result = await validateIntent({
        intentType: "transaction",
        asset: { type: "native" },
        type: "send",
        sender: senderAddress,
        recipient: validRecipient,
        amount: 1000n,
      });

      expect(result.errors.amount).toBeInstanceOf(NotEnoughBalance);
    });

    it("maps delegate.unchanged to InvalidAddressBecauseAlreadyDelegated for stake", async () => {
      mockGetAccountByAddress.mockResolvedValue(
        makeUserAccount({
          delegate: { alias: "baker", address: validRecipient, active: true },
          delegationLevel: 1,
        }),
      );

      mockEstimateFees.mockResolvedValue({
        fees: 0n,
        gasLimit: 0n,
        storageLimit: 0n,
        estimatedFees: 500n,
        taquitoError: "proto.024-PtTALLiN.delegate.unchanged",
      });

      const result = await validateIntent({
        intentType: "staking",
        asset: { type: "native" },
        type: "stake",
        sender: senderAddress,
        recipient: "",
        amount: 1n,
      });

      expect(result.errors.recipient).toBeInstanceOf(InvalidAddressBecauseAlreadyDelegated);
    });

    it("maps empty_implicit_contract to NotEnoughBalanceToDelegate", async () => {
      mockEstimateFees.mockResolvedValue({
        fees: 0n,
        gasLimit: 0n,
        storageLimit: 0n,
        estimatedFees: 500n,
        taquitoError: "proto.empty_implicit_contract",
      });

      const result = await validateIntent({
        intentType: "staking",
        asset: { type: "native" },
        type: "delegate",
        sender: senderAddress,
        recipient: validRecipient,
        amount: 0n,
      });

      expect(result.errors.amount).toBeInstanceOf(NotEnoughBalanceToDelegate);
    });

    it("maps staking.too_much_unstaked to NotEnoughBalance for unstake", async () => {
      mockGetAccountByAddress.mockResolvedValue(makeUserAccount({ stakedBalance: 4000 }));
      mockEstimateFees.mockResolvedValue({
        fees: 0n,
        gasLimit: 0n,
        storageLimit: 0n,
        estimatedFees: 500n,
        taquitoError: "proto.alpha.staking.too_much_unstaked",
      });

      const result = await validateIntent({
        intentType: "staking",
        asset: { type: "native" },
        type: "unstake",
        sender: senderAddress,
        recipient: "",
        amount: 1000n,
      });

      expect(result.errors.amount).toBeInstanceOf(NotEnoughBalance);
    });

    it("maps contract.must_be_delegated_to_stake to MustDelegateBeforeStaking", async () => {
      mockGetAccountByAddress.mockResolvedValue(
        makeUserAccount({
          delegate: { alias: "baker", address: validRecipient, active: true },
          delegationLevel: 1,
        }),
      );
      mockEstimateFees.mockResolvedValue({
        fees: 0n,
        gasLimit: 0n,
        storageLimit: 0n,
        estimatedFees: 500n,
        taquitoError: "proto.alpha.contract.must_be_delegated_to_stake",
      });

      const result = await validateIntent({
        intentType: "staking",
        asset: { type: "native" },
        type: "stake",
        sender: senderAddress,
        recipient: "",
        amount: 1000n,
      });

      expect(result.errors.amount).toBeInstanceOf(MustDelegateBeforeStaking);
    });

    it("maps unknown taquito errors to a generic Error on amount", async () => {
      mockEstimateFees.mockResolvedValue({
        fees: 0n,
        gasLimit: 0n,
        storageLimit: 0n,
        estimatedFees: 500n,
        taquitoError: "proto.unknown_rpc_failure",
      });

      const result = await validateIntent({
        intentType: "transaction",
        asset: { type: "native" },
        type: "send",
        sender: senderAddress,
        recipient: validRecipient,
        amount: 1000n,
      });

      expect(result.errors.amount).toBeInstanceOf(Error);
      expect(result.errors.amount?.message).toBe("proto.unknown_rpc_failure");
    });
  });

  describe("account fetch and reveal", () => {
    it("uses fixed estimated fees when account is not revealed and skips estimateFees", async () => {
      mockGetAccountByAddress.mockResolvedValue(makeUserAccount({ revealed: false }));

      const amount = 1000000n;
      const result = await validateIntent({
        intentType: "transaction",
        asset: { type: "native" },
        type: "send",
        sender: senderAddress,
        recipient: validRecipient,
        amount,
      });

      expect(mockEstimateFees).not.toHaveBeenCalled();
      expect(result.estimatedFees).toBe(2000n);
      expect(result.amount).toBe(amount);
      expect(result.totalSpent).toBe(amount + 2000n);
    });

    it("sets estimation error when getAccountByAddress rejects", async () => {
      mockGetAccountByAddress.mockRejectedValue(new Error("network failure"));

      const result = await validateIntent({
        intentType: "transaction",
        asset: { type: "native" },
        type: "send",
        sender: senderAddress,
        recipient: validRecipient,
        amount: 1000n,
      });

      expect(result.errors.estimation).toBeInstanceOf(Error);
      expect(result.errors.estimation?.message).toBe("network failure");
      expect(result.estimatedFees).toBe(0n);
      expect(result.amount).toBe(1000n);
      expect(result.totalSpent).toBe(1000n);
    });

    it("sets estimation error when account type is not user", async () => {
      mockGetAccountByAddress.mockResolvedValue({
        type: "empty",
        address: senderAddress,
        counter: 0,
      });

      const result = await validateIntent({
        intentType: "transaction",
        asset: { type: "native" },
        type: "send",
        sender: senderAddress,
        recipient: validRecipient,
        amount: 1000n,
      });

      expect(result.errors.estimation).toBeInstanceOf(Error);
      expect(result.estimatedFees).toBe(0n);
    });
  });

  describe("FA2 token validation", () => {
    it("should set amount to full FA2 token balance when useAllAmount is true", async () => {
      const contract = "KT1CpeSQKdkhWi4pinYcseCFKmDhs5M74BkU";
      const tokenBalance = "1234567890";

      mockGetTokensBalances.mockResolvedValue([
        {
          id: 1,
          account: { address: senderAddress },
          token: {
            id: 1,
            contract: { address: contract },
            tokenId: "0",
            standard: "fa2" as const,
            metadata: { symbol: "TK", decimals: "6" },
          },
          balance: tokenBalance,
          transfersCount: 0,
          firstLevel: 0,
          firstTime: "",
          lastLevel: 0,
          lastTime: "",
        },
      ]);

      const result = await validateIntent({
        intentType: "transaction",
        asset: { type: "token", assetReference: `${contract}:0` },
        type: "send",
        sender: senderAddress,
        recipient: validRecipient,
        amount: 0n,
        useAllAmount: true,
      });

      expect(mockGetTokensBalances).toHaveBeenCalledWith(senderAddress, {
        contractAddress: contract,
        tokenId: 0,
      });
      expect(result.errors.amount).toBeUndefined();
      expect(result.amount).toBe(BigInt(tokenBalance));
      expect(result.totalSpent).toBe(1000n);
    });

    it("should return NotEnoughBalance when estimation reports script_rejected (FA2_INSUFFICIENT_BALANCE)", async () => {
      mockEstimateFees.mockResolvedValue({
        fees: 0n,
        gasLimit: 0n,
        storageLimit: 0n,
        estimatedFees: 0n,
        taquitoError: "proto.024-PtTALLiN.michelson_v1.script_rejected",
      });

      const result = await validateIntent({
        intentType: "transaction",
        asset: { type: "token", assetReference: "KT1CpeSQKdkhWi4pinYcseCFKmDhs5M74BkU:0" },
        type: "send",
        sender: senderAddress,
        recipient: validRecipient,
        amount: 1000000n,
      });

      expect(result.errors.amount).toBeInstanceOf(NotEnoughBalance);
    });

    it("should set amount to 0n when useAllAmount and token balance row is missing", async () => {
      const contract = "KT1CpeSQKdkhWi4pinYcseCFKmDhs5M74BkU";
      mockGetTokensBalances.mockResolvedValue([]);

      const result = await validateIntent({
        intentType: "transaction",
        asset: { type: "token", assetReference: `${contract}:0` },
        type: "send",
        sender: senderAddress,
        recipient: validRecipient,
        amount: 0n,
        useAllAmount: true,
      });

      expect(result.amount).toBe(0n);
      expect(result.totalSpent).toBe(1000n);
    });
  });

  describe("native XTZ send max", () => {
    it("should fall back to balance minus fees when estimateFees returns amount 0n", async () => {
      mockEstimateFees.mockResolvedValue({
        fees: 1000n,
        gasLimit: 10000n,
        storageLimit: 0n,
        estimatedFees: 1000n,
        amount: 0n,
      });

      const result = await validateIntent({
        intentType: "transaction",
        asset: { type: "native" },
        type: "send",
        sender: senderAddress,
        recipient: validRecipient,
        amount: 0n,
        useAllAmount: true,
      });

      expect(mockGetTokensBalances).not.toHaveBeenCalled();
      expect(result.amount).toBe(4999000n);
      expect(result.totalSpent).toBe(5000000n);
    });

    it("should prefer positive estimatedAmount from estimateFees over balance minus fees", async () => {
      const estimatedFromTaquito = 3000000n;
      mockEstimateFees.mockResolvedValue({
        fees: 1000n,
        gasLimit: 10000n,
        storageLimit: 0n,
        estimatedFees: 1000n,
        amount: estimatedFromTaquito,
      });

      const result = await validateIntent({
        intentType: "transaction",
        asset: { type: "native" },
        type: "send",
        sender: senderAddress,
        recipient: validRecipient,
        amount: 0n,
        useAllAmount: true,
      });

      expect(result.amount).toBe(estimatedFromTaquito);
      expect(result.totalSpent).toBe(estimatedFromTaquito + 1000n);
    });
  });

  describe("successful validation", () => {
    it("should return valid result with correct values", async () => {
      const amount = 1000000n;
      const estimatedFees = 1500n;

      mockEstimateFees.mockResolvedValue({
        fees: 1000n,
        gasLimit: 10000n,
        storageLimit: 0n,
        estimatedFees,
      });

      const result = await validateIntent({
        intentType: "transaction",
        asset: { type: "native" },
        type: "send",
        sender: senderAddress,
        recipient: validRecipient,
        amount,
      });

      expect(result).toMatchObject({
        errors: {},
        warnings: {},
        estimatedFees,
        amount,
        totalSpent: amount + estimatedFees,
      });
    });
  });
});
