import type {
  AssetInfo,
  Balance,
  FeeEstimation,
  TransactionIntent,
} from "@ledgerhq/coin-module-framework/api/types";
import {
  AmountRequired,
  InvalidAddress,
  InvalidAddressBecauseDestinationIsAlsoSource,
  NotEnoughBalance,
  RecipientRequired,
} from "@ledgerhq/ledger-wallet-framework/errors";
import BigNumber from "bignumber.js";
import { HEDERA_OPERATION_TYPES, HEDERA_TRANSACTION_MODES } from "../constants";
import {
  ClaimRewardsFeesWarning,
  HederaInsufficientFundsForAssociation,
  HederaInvalidStakingNodeIdError,
  HederaMemoExceededSizeError,
  HederaNoStakingRewardsError,
  HederaRecipientEvmAddressVerificationRequired,
  HederaRecipientTokenAssociationRequired,
  HederaRecipientTokenAssociationUnverified,
  HederaRedundantStakingNodeIdError,
} from "../errors";
import { apiClient } from "../network/api";
import { rpcClient } from "../network/rpc";
import {
  checkAccountTokenAssociationStatus,
  getCurrencyToUSDRate,
  getHederaAccountForValidation,
  getHederaValidators,
} from "../network/utils";
import { getMockedConfig } from "../test/fixtures/config.fixture";
import { getMockedCurrency } from "../test/fixtures/currency.fixture";
import { getMockedMirrorAccount } from "../test/fixtures/mirror.fixture";
import { getMockedValidator } from "../test/fixtures/validator.fixture";
import type { HederaMemo, HederaTxData } from "../types";
import { estimateFees } from "./estimateFees";
import { validateIntent } from "./validateIntent";
import { HEDERA_MAX_MEMO_SIZE } from "./validateMemo";

jest.mock("../network/api");
jest.mock("./estimateFees", () => ({
  ...jest.requireActual("./estimateFees"),
  estimateFees: jest.fn(),
}));
jest.mock("../network/utils", () => ({
  ...jest.requireActual("../network/utils"),
  getHederaValidators: jest.fn(),
  getCurrencyToUSDRate: jest.fn(),
  checkAccountTokenAssociationStatus: jest.fn(),
}));
jest.mock("../network/rpc", () => ({
  rpcClient: require("../test/fixtures/rpc.fixture").getMockedRpcClient(),
}));

const mockGetAccount = apiClient.getAccount as jest.Mock;
const mockEstimateFees = estimateFees as jest.Mock;
const mockGetHederaValidators = getHederaValidators as unknown as jest.Mock;
const mockGetCurrencyToUSDRate = getCurrencyToUSDRate as unknown as jest.Mock;
const mockCheckAssociation = checkAccountTokenAssociationStatus as unknown as jest.Mock;

type HederaIntent = TransactionIntent<HederaMemo, HederaTxData>;

const config = getMockedConfig();
const currencyId = getMockedCurrency().id;

const SENDER = "0.0.1000";
const RECIPIENT = "0.0.2000";

const NATIVE_ASSET: AssetInfo = { type: "native" };
const HTS_ASSET: AssetInfo = { type: "hts", assetReference: "0.0.456858" };
const ERC20_ASSET: AssetInfo = {
  type: "erc20",
  assetReference: "0x39ceba2b467fa987546000eb5d1373acf1f3a2e1",
};

function balance(asset: AssetInfo, value: bigint, locked = 0n): Balance {
  return { asset, value, locked };
}

function makeIntent(overrides: {
  type?: string;
  sender?: string;
  recipient?: string;
  amount?: bigint;
  asset?: AssetInfo;
  useAllAmount?: boolean;
  data?: HederaTxData;
  memo?: HederaMemo;
}): HederaIntent {
  return {
    intentType: "transaction",
    type: HEDERA_TRANSACTION_MODES.Send,
    sender: SENDER,
    recipient: "",
    amount: 0n,
    asset: NATIVE_ASSET,
    data: { type: "none" },
    ...overrides,
  } as HederaIntent;
}

function callValidateIntent(intent: HederaIntent, balances: Balance[], customFees?: FeeEstimation) {
  return validateIntent({ config, currencyId, intent, balances, customFees });
}

describe("validateIntent", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getHederaAccountForValidation.reset();
    mockGetAccount.mockResolvedValue(getMockedMirrorAccount());
    mockGetHederaValidators.mockResolvedValue([]);
    mockGetCurrencyToUSDRate.mockResolvedValue(new BigNumber(0.2));
    mockCheckAssociation.mockResolvedValue(true);
    mockEstimateFees.mockResolvedValue({ tinybars: new BigNumber(0) });
  });

  afterAll(async () => {
    await rpcClient._resetInstance();
  });

  describe("staking", () => {
    describe.each([HEDERA_TRANSACTION_MODES.Delegate, HEDERA_TRANSACTION_MODES.Redelegate])(
      "%s node id validation",
      mode => {
        beforeEach(() => {
          mockGetHederaValidators.mockResolvedValue([getMockedValidator({ id: "1" })]);
          mockEstimateFees.mockResolvedValue({ tinybars: new BigNumber(50) });
        });

        it("flags a missing node id without fetching the mirror account", async () => {
          mockGetAccount.mockResolvedValue(getMockedMirrorAccount({ staked_node_id: null }));
          const intent = makeIntent({ type: mode, data: { type: "none" } });

          const result = await callValidateIntent(intent, [balance(NATIVE_ASSET, 100000n)]);

          expect(result.errors.missingStakingNodeId).toBeInstanceOf(
            HederaInvalidStakingNodeIdError,
          );
          expect(result.errors.missingStakingNodeId?.message).toBe("Validator must be set");
          expect(result.errors.stakingNodeId).toBeUndefined();
          expect(mockGetAccount).not.toHaveBeenCalled();
        });

        it("flags a node id absent from the validator list", async () => {
          mockGetAccount.mockResolvedValue(getMockedMirrorAccount({ staked_node_id: null }));
          const intent = makeIntent({ type: mode, data: { type: "staking", stakingNodeId: 999 } });

          const result = await callValidateIntent(intent, [balance(NATIVE_ASSET, 100000n)]);

          expect(result.errors.stakingNodeId).toBeInstanceOf(HederaInvalidStakingNodeIdError);
        });

        it("flags delegating to the already-delegated node", async () => {
          mockGetAccount.mockResolvedValue(getMockedMirrorAccount({ staked_node_id: 1 }));
          const intent = makeIntent({ type: mode, data: { type: "staking", stakingNodeId: 1 } });

          const result = await callValidateIntent(intent, [balance(NATIVE_ASSET, 100000n)]);

          expect(result.errors.stakingNodeId).toBeInstanceOf(HederaRedundantStakingNodeIdError);
        });
      },
    );

    it("delegate with a valid, not-yet-delegated node completes with no errors", async () => {
      mockGetHederaValidators.mockResolvedValue([getMockedValidator({ id: "1" })]);
      mockGetAccount.mockResolvedValue(getMockedMirrorAccount({ staked_node_id: null }));
      mockEstimateFees.mockResolvedValue({ tinybars: new BigNumber(50) });
      const intent = makeIntent({
        type: HEDERA_TRANSACTION_MODES.Delegate,
        data: { type: "staking", stakingNodeId: 1 },
      });

      const result = await callValidateIntent(intent, [balance(NATIVE_ASSET, 100000n)]);

      expect(result.errors).toEqual({});
      expect(result.amount).toBe(0n);
      expect(result.totalSpent).toBe(50n);
    });

    it("resolves with errors.validators instead of throwing when the validator fetch fails", async () => {
      mockGetHederaValidators.mockRejectedValue(new Error("network down"));
      mockEstimateFees.mockResolvedValue({ tinybars: new BigNumber(50) });
      const intent = makeIntent({
        type: HEDERA_TRANSACTION_MODES.Delegate,
        data: { type: "staking", stakingNodeId: 1 },
      });

      const result = await callValidateIntent(intent, [balance(NATIVE_ASSET, 100000n)]);

      expect(result.errors.validators).toBeInstanceOf(Error);
      expect(result.errors.stakingNodeId).toBeUndefined();
      expect(mockGetAccount).not.toHaveBeenCalled();
    });

    it("undelegate never validates a node id, even though it clears one, and never fetches the account", async () => {
      const intent = makeIntent({
        type: HEDERA_TRANSACTION_MODES.Undelegate,
        data: { type: "staking", stakingNodeId: null },
      });

      const result = await callValidateIntent(intent, [balance(NATIVE_ASSET, 100000n)]);

      expect(result.errors.missingStakingNodeId).toBeUndefined();
      expect(result.errors.stakingNodeId).toBeUndefined();
      expect(mockGetAccount).not.toHaveBeenCalled();
    });

    it.each([HEDERA_TRANSACTION_MODES.Undelegate, HEDERA_TRANSACTION_MODES.ClaimRewards])(
      "%s neither fetches the validators nor is blocked when that fetch would fail",
      async type => {
        mockGetHederaValidators.mockRejectedValue(new Error("network down"));
        const intent = makeIntent({ type, data: { type: "staking", stakingNodeId: null } });

        const result = await callValidateIntent(intent, [balance(NATIVE_ASSET, 100000n)]);

        expect(result.errors.validators).toBeUndefined();
        expect(mockGetHederaValidators).not.toHaveBeenCalled();
      },
    );

    it("claim-rewards with no pending reward adds errors.noRewardsToClaim", async () => {
      mockGetAccount.mockResolvedValue(getMockedMirrorAccount({ pending_reward: 0 }));
      mockEstimateFees.mockResolvedValue({ tinybars: new BigNumber(10) });
      const intent = makeIntent({ type: HEDERA_TRANSACTION_MODES.ClaimRewards });

      const result = await callValidateIntent(intent, [balance(NATIVE_ASSET, 100000n)]);

      expect(result.errors.noRewardsToClaim).toBeInstanceOf(HederaNoStakingRewardsError);
    });

    it("claim-rewards warns, but does not error, when the fee exceeds the pending reward", async () => {
      mockGetAccount.mockResolvedValue(getMockedMirrorAccount({ pending_reward: 10 }));
      mockEstimateFees.mockResolvedValue({ tinybars: new BigNumber(100) });
      const intent = makeIntent({ type: HEDERA_TRANSACTION_MODES.ClaimRewards });

      const result = await callValidateIntent(intent, [balance(NATIVE_ASSET, 100000n)]);

      expect(result.warnings.claimRewardsFee).toBeInstanceOf(ClaimRewardsFeesWarning);
      expect(result.errors.noRewardsToClaim).toBeUndefined();
    });

    it("prices claim-rewards as a CryptoTransfer, not the legacy CryptoUpdate", async () => {
      mockGetAccount.mockResolvedValue(getMockedMirrorAccount({ pending_reward: 1000 }));
      mockEstimateFees.mockResolvedValue({ tinybars: new BigNumber(10) });
      const intent = makeIntent({ type: HEDERA_TRANSACTION_MODES.ClaimRewards });

      await callValidateIntent(intent, [balance(NATIVE_ASSET, 100000n)]);

      expect(mockEstimateFees).toHaveBeenCalledTimes(1);
      expect(mockEstimateFees).toHaveBeenCalledWith(
        expect.objectContaining({ operationType: HEDERA_OPERATION_TYPES.CryptoTransfer }),
      );
    });

    // The fee check is the same tail branch for every staking mode, so one mode covers it.
    it("adds errors.fee when native balance cannot cover the fee", async () => {
      mockGetAccount.mockResolvedValue(getMockedMirrorAccount({ pending_reward: 1000 }));
      mockEstimateFees.mockResolvedValue({ tinybars: new BigNumber(100) });
      const intent = makeIntent({ type: HEDERA_TRANSACTION_MODES.ClaimRewards });

      const result = await callValidateIntent(intent, [balance(NATIVE_ASSET, 10n)]);

      expect(result.errors.fee).toBeInstanceOf(NotEnoughBalance);
    });
  });

  describe("native send", () => {
    beforeEach(() => {
      mockEstimateFees.mockResolvedValue({ tinybars: new BigNumber(100) });
    });

    it("adds errors.amount = AmountRequired when amount is zero and useAllAmount is false", async () => {
      const intent = makeIntent({ recipient: RECIPIENT, amount: 0n, useAllAmount: false });

      const result = await callValidateIntent(intent, [balance(NATIVE_ASSET, 100000n)]);

      expect(result.errors.amount).toBeInstanceOf(AmountRequired);
    });

    it("resolves useAllAmount to balance minus fees when balance covers the fee, with no error", async () => {
      const intent = makeIntent({ recipient: RECIPIENT, amount: 0n, useAllAmount: true });

      const result = await callValidateIntent(intent, [balance(NATIVE_ASSET, 1000n)]);

      expect(result.errors.amount).toBeUndefined();
      expect(result.amount).toBe(900n);
      expect(result.totalSpent).toBe(1000n);
    });

    it("resolves useAllAmount to 0 and reports NotEnoughBalance (not AmountRequired) when balance cannot cover the fee", async () => {
      const intent = makeIntent({ recipient: RECIPIENT, amount: 0n, useAllAmount: true });

      const result = await callValidateIntent(intent, [balance(NATIVE_ASSET, 100n)]);

      expect(result.amount).toBe(0n);
      expect(result.errors.amount).toBeInstanceOf(NotEnoughBalance);
    });

    it("adds errors.amount = NotEnoughBalance when amount + fees exceed balance", async () => {
      const intent = makeIntent({ recipient: RECIPIENT, amount: 950n, useAllAmount: false });

      const result = await callValidateIntent(intent, [balance(NATIVE_ASSET, 1000n)]);

      expect(result.errors.amount).toBeInstanceOf(NotEnoughBalance);
    });

    it("adds errors.recipient = RecipientRequired when recipient is empty", async () => {
      const intent = makeIntent({ recipient: "", amount: 10n });

      const result = await callValidateIntent(intent, [balance(NATIVE_ASSET, 100000n)]);

      expect(result.errors.recipient).toBeInstanceOf(RecipientRequired);
    });

    it("adds errors.recipient from the parser when the address is malformed", async () => {
      const intent = makeIntent({ recipient: "not-an-account", amount: 10n });

      const result = await callValidateIntent(intent, [balance(NATIVE_ASSET, 100000n)]);

      expect(result.errors.recipient).toBeInstanceOf(InvalidAddress);
    });

    it("adds errors.recipient = InvalidAddressBecauseDestinationIsAlsoSource for a self-send", async () => {
      const intent = makeIntent({ recipient: SENDER, amount: 10n });

      const result = await callValidateIntent(intent, [balance(NATIVE_ASSET, 100000n)]);

      expect(result.errors.recipient).toBeInstanceOf(InvalidAddressBecauseDestinationIsAlsoSource);
    });

    it("runs no association check and raises no warnings", async () => {
      const intent = makeIntent({ recipient: RECIPIENT, amount: 100n });

      const result = await callValidateIntent(intent, [balance(NATIVE_ASSET, 100000n)]);

      expect(mockCheckAssociation).not.toHaveBeenCalled();
      expect(result.warnings).toEqual({});
    });

    it("completes with no errors for a well-formed send", async () => {
      const intent = makeIntent({ recipient: RECIPIENT, amount: 500n });

      const result = await callValidateIntent(intent, [balance(NATIVE_ASSET, 1000n)]);

      expect(result.errors).toEqual({});
      expect(result.amount).toBe(500n);
      expect(result.totalSpent).toBe(600n);
      expect(result.estimatedFees).toBe(100n);
    });
  });

  describe("hts token send", () => {
    beforeEach(() => {
      mockEstimateFees.mockResolvedValue({ tinybars: new BigNumber(200) });
    });

    it("adds errors.amount = AmountRequired for a zero amount even with useAllAmount (legacy asymmetry)", async () => {
      const intent = makeIntent({
        asset: HTS_ASSET,
        recipient: RECIPIENT,
        amount: 0n,
        useAllAmount: true,
      });

      const result = await callValidateIntent(intent, [
        balance(NATIVE_ASSET, 100000n),
        balance(HTS_ASSET, 0n),
      ]);

      expect(result.errors.amount).toBeInstanceOf(AmountRequired);
    });

    it("keeps AmountRequired for a zero amount even when the native balance cannot cover the fee", async () => {
      const intent = makeIntent({
        asset: HTS_ASSET,
        recipient: RECIPIENT,
        amount: 0n,
        useAllAmount: true,
      });

      const result = await callValidateIntent(intent, [
        balance(NATIVE_ASSET, 0n),
        balance(HTS_ASSET, 0n),
      ]);

      expect(result.errors.amount).toBeInstanceOf(AmountRequired);
    });

    it("warns when the recipient has not associated the token", async () => {
      mockCheckAssociation.mockResolvedValueOnce(false);
      const intent = makeIntent({ asset: HTS_ASSET, recipient: RECIPIENT, amount: 100n });

      const result = await callValidateIntent(intent, [
        balance(NATIVE_ASSET, 100000n),
        balance(HTS_ASSET, 1000n),
      ]);

      expect(mockCheckAssociation).toHaveBeenCalledTimes(1);
      expect(mockCheckAssociation).toHaveBeenCalledWith({
        configOrCurrencyId: config,
        address: RECIPIENT,
        tokenId: "0.0.456858",
      });
      expect(result.warnings.missingAssociation).toBeInstanceOf(
        HederaRecipientTokenAssociationRequired,
      );
      expect(result.errors).toEqual({});
    });

    it("warns when the association status cannot be verified", async () => {
      mockCheckAssociation.mockRejectedValueOnce(new Error("mirror node unavailable"));
      const intent = makeIntent({ asset: HTS_ASSET, recipient: RECIPIENT, amount: 100n });

      const result = await callValidateIntent(intent, [
        balance(NATIVE_ASSET, 100000n),
        balance(HTS_ASSET, 1000n),
      ]);

      expect(result.warnings.unverifiedAssociation).toBeInstanceOf(
        HederaRecipientTokenAssociationUnverified,
      );
      expect(result.errors).toEqual({});
    });

    it("skips the association check when the recipient is already invalid", async () => {
      const intent = makeIntent({ asset: HTS_ASSET, recipient: "", amount: 100n });

      const result = await callValidateIntent(intent, [
        balance(NATIVE_ASSET, 100000n),
        balance(HTS_ASSET, 1000n),
      ]);

      expect(mockCheckAssociation).not.toHaveBeenCalled();
      expect(result.errors.recipient).toBeInstanceOf(RecipientRequired);
      expect(result.warnings).toEqual({});
    });

    it("adds errors.amount = NotEnoughBalance (default message) when the token balance is too low", async () => {
      const intent = makeIntent({ asset: HTS_ASSET, recipient: RECIPIENT, amount: 500n });

      const result = await callValidateIntent(intent, [
        balance(NATIVE_ASSET, 100000n),
        balance(HTS_ASSET, 10n),
      ]);

      expect(result.errors.amount).toBeInstanceOf(NotEnoughBalance);
      expect(result.errors.amount?.message).not.toBe("");
    });

    it("adds errors.amount (not errors.fee) when the native balance cannot cover the fee", async () => {
      const intent = makeIntent({ asset: HTS_ASSET, recipient: RECIPIENT, amount: 5n });

      const result = await callValidateIntent(intent, [
        balance(NATIVE_ASSET, 0n),
        balance(HTS_ASSET, 1000n),
      ]);

      expect(result.errors.amount).toBeInstanceOf(NotEnoughBalance);
      expect(result.errors.fee).toBeUndefined();
    });

    it("completes with no errors for a well-formed token send", async () => {
      const intent = makeIntent({ asset: HTS_ASSET, recipient: RECIPIENT, amount: 100n });

      const result = await callValidateIntent(intent, [
        balance(NATIVE_ASSET, 100000n),
        balance(HTS_ASSET, 1000n),
      ]);

      expect(result.errors).toEqual({});
      expect(result.amount).toBe(100n);
      expect(result.totalSpent).toBe(100n);
      expect(result.estimatedFees).toBe(200n);
    });
  });

  describe("erc20 token send", () => {
    beforeEach(() => {
      mockEstimateFees.mockResolvedValue({ tinybars: new BigNumber(300) });
    });

    it("prices fees through the ContractCall path with the intent as-is", async () => {
      const intent = makeIntent({ asset: ERC20_ASSET, recipient: RECIPIENT, amount: 10n });

      await callValidateIntent(intent, [
        balance(NATIVE_ASSET, 100000n),
        balance(ERC20_ASSET, 1000n),
      ]);

      expect(mockEstimateFees).toHaveBeenCalledTimes(1);
      expect(mockEstimateFees).toHaveBeenCalledWith(
        expect.objectContaining({
          operationType: HEDERA_OPERATION_TYPES.ContractCall,
          txIntent: intent,
        }),
      );
    });

    it("warns that the recipient evm address is unverified, without an association check", async () => {
      const intent = makeIntent({ asset: ERC20_ASSET, recipient: RECIPIENT, amount: 10n });

      const result = await callValidateIntent(intent, [
        balance(NATIVE_ASSET, 100000n),
        balance(ERC20_ASSET, 1000n),
      ]);

      // An ERC20 contract address would never match a mirror `token_id`, so the check would
      // always report "not associated" and warn on every ERC20 send.
      expect(mockCheckAssociation).not.toHaveBeenCalled();
      expect(result.warnings.unverifiedEvmAddress).toBeInstanceOf(
        HederaRecipientEvmAddressVerificationRequired,
      );
      expect(result.errors).toEqual({});
    });

    it("adds errors.amount when the token balance is too low", async () => {
      const intent = makeIntent({ asset: ERC20_ASSET, recipient: RECIPIENT, amount: 500n });

      const result = await callValidateIntent(intent, [
        balance(NATIVE_ASSET, 100000n),
        balance(ERC20_ASSET, 10n),
      ]);

      expect(result.errors.amount).toBeInstanceOf(NotEnoughBalance);
    });

    it("adds errors.amount (not errors.fee) when the native balance cannot cover the fee", async () => {
      const intent = makeIntent({ asset: ERC20_ASSET, recipient: RECIPIENT, amount: 5n });

      const result = await callValidateIntent(intent, [
        balance(NATIVE_ASSET, 0n),
        balance(ERC20_ASSET, 1000n),
      ]);

      expect(result.errors.amount).toBeInstanceOf(NotEnoughBalance);
      expect(result.errors.fee).toBeUndefined();
    });
  });

  describe("token-associate", () => {
    // 0.25 HBAR: the 0.05 USD minimum at the mocked 0.2 USD/HBAR rate.
    const ENOUGH_FOR_ASSOCIATION = 25_000_000n;

    beforeEach(() => {
      mockEstimateFees.mockResolvedValue({ tinybars: new BigNumber(500000) });
      mockCheckAssociation.mockResolvedValue(false);
    });

    it("has no errors, amount 0, and totalSpent equal to the fee", async () => {
      const intent = makeIntent({
        type: HEDERA_TRANSACTION_MODES.TokenAssociate,
        asset: HTS_ASSET,
      });

      const result = await callValidateIntent(intent, [
        balance(NATIVE_ASSET, ENOUGH_FOR_ASSOCIATION),
      ]);

      expect(result.errors).toEqual({});
      expect(result.amount).toBe(0n);
      expect(result.totalSpent).toBe(500000n);
      expect(result.estimatedFees).toBe(500000n);
    });

    it("adds errors.insufficientAssociateBalance when the account is worth less than the minimum", async () => {
      const intent = makeIntent({
        type: HEDERA_TRANSACTION_MODES.TokenAssociate,
        asset: HTS_ASSET,
      });

      const result = await callValidateIntent(intent, [
        balance(NATIVE_ASSET, ENOUGH_FOR_ASSOCIATION - 1n),
      ]);

      expect(result.errors.insufficientAssociateBalance).toBeInstanceOf(
        HederaInsufficientFundsForAssociation,
      );
      expect(result.errors.insufficientAssociateBalance).toMatchObject({
        requiredWorthInUSD: config.tokenAssociationMinUsd,
      });
    });

    it("treats a missing USD rate as zero worth", async () => {
      mockGetCurrencyToUSDRate.mockResolvedValue(null);
      const intent = makeIntent({
        type: HEDERA_TRANSACTION_MODES.TokenAssociate,
        asset: HTS_ASSET,
      });

      const result = await callValidateIntent(intent, [balance(NATIVE_ASSET, 100_000_000_000n)]);

      expect(result.errors.insufficientAssociateBalance).toBeInstanceOf(
        HederaInsufficientFundsForAssociation,
      );
    });

    it("skips the balance check when the sender already has the token associated", async () => {
      mockCheckAssociation.mockResolvedValue(true);
      const intent = makeIntent({
        type: HEDERA_TRANSACTION_MODES.TokenAssociate,
        asset: HTS_ASSET,
      });

      const result = await callValidateIntent(intent, [balance(NATIVE_ASSET, 0n)]);

      expect(mockCheckAssociation).toHaveBeenCalledWith({
        configOrCurrencyId: config,
        address: SENDER,
        tokenId: "0.0.456858",
      });
      expect(result.errors).toEqual({});
    });

    it("runs the balance check when the association status can't be determined", async () => {
      mockCheckAssociation.mockRejectedValue(new Error("mirror node unavailable"));
      const intent = makeIntent({
        type: HEDERA_TRANSACTION_MODES.TokenAssociate,
        asset: HTS_ASSET,
      });

      const result = await callValidateIntent(intent, [
        balance(NATIVE_ASSET, ENOUGH_FOR_ASSOCIATION - 1n),
      ]);

      expect(result.errors.insufficientAssociateBalance).toBeInstanceOf(
        HederaInsufficientFundsForAssociation,
      );
    });
  });

  describe("memo", () => {
    const OVERSIZED_MEMO = "a".repeat(HEDERA_MAX_MEMO_SIZE + 1);

    beforeEach(() => {
      mockEstimateFees.mockResolvedValue({ tinybars: new BigNumber(100) });
    });

    it("adds errors.transaction when the memo exceeds the maximum size", async () => {
      const intent = makeIntent({
        recipient: RECIPIENT,
        amount: 10n,
        memo: { type: "string", kind: "text", value: OVERSIZED_MEMO },
      });

      const result = await callValidateIntent(intent, [balance(NATIVE_ASSET, 100000n)]);

      expect(result.errors.transaction).toBeInstanceOf(HederaMemoExceededSizeError);
    });

    it("keeps the mode-specific errors alongside the memo error", async () => {
      const intent = makeIntent({
        recipient: "",
        amount: 10n,
        memo: { type: "string", kind: "text", value: OVERSIZED_MEMO },
      });

      const result = await callValidateIntent(intent, [balance(NATIVE_ASSET, 100000n)]);

      expect(result.errors.transaction).toBeInstanceOf(HederaMemoExceededSizeError);
      expect(result.errors.recipient).toBeInstanceOf(RecipientRequired);
    });

    it("accepts a memo at the maximum size", async () => {
      const intent = makeIntent({
        recipient: RECIPIENT,
        amount: 10n,
        memo: { type: "string", kind: "text", value: "a".repeat(HEDERA_MAX_MEMO_SIZE) },
      });

      const result = await callValidateIntent(intent, [balance(NATIVE_ASSET, 100000n)]);

      expect(result.errors.transaction).toBeUndefined();
    });

    it("flags an oversized memo on a token-associate intent too", async () => {
      const intent = makeIntent({
        type: HEDERA_TRANSACTION_MODES.TokenAssociate,
        asset: HTS_ASSET,
        memo: { type: "string", kind: "text", value: OVERSIZED_MEMO },
      });

      const result = await callValidateIntent(intent, [balance(NATIVE_ASSET, 25_000_000n)]);

      expect(result.errors.transaction).toBeInstanceOf(HederaMemoExceededSizeError);
    });
  });

  describe("fee resolution (customFees)", () => {
    it("skips estimation and uses customFees.value when it is non-zero", async () => {
      const intent = makeIntent({ recipient: RECIPIENT, amount: 10n });

      const result = await callValidateIntent(intent, [balance(NATIVE_ASSET, 100000n)], {
        value: 777n,
      });

      expect(mockEstimateFees).not.toHaveBeenCalled();
      expect(result.estimatedFees).toBe(777n);
    });

    it("still estimates when customFees.value is 0n", async () => {
      mockEstimateFees.mockResolvedValue({ tinybars: new BigNumber(123) });
      const intent = makeIntent({ recipient: RECIPIENT, amount: 10n });

      const result = await callValidateIntent(intent, [balance(NATIVE_ASSET, 100000n)], {
        value: 0n,
      });

      expect(mockEstimateFees).toHaveBeenCalledTimes(1);
      expect(result.estimatedFees).toBe(123n);
    });
  });

  describe("account caching", () => {
    it("fetches the mirror account once for two consecutive validations of the same sender", async () => {
      mockGetAccount.mockResolvedValue(getMockedMirrorAccount({ pending_reward: 1000 }));
      mockEstimateFees.mockResolvedValue({ tinybars: new BigNumber(10) });
      const intent = makeIntent({ type: HEDERA_TRANSACTION_MODES.ClaimRewards });
      const balances = [balance(NATIVE_ASSET, 100000n)];

      await callValidateIntent(intent, balances);
      await callValidateIntent(intent, balances);

      expect(mockGetAccount).toHaveBeenCalledTimes(1);
    });
  });
});
