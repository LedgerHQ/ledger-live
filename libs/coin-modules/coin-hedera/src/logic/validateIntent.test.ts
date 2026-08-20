import type { Balance, TransactionIntent } from "@ledgerhq/coin-module-framework/api/types";
import {
  AmountRequired,
  InvalidAddressBecauseDestinationIsAlsoSource,
  NotEnoughBalance,
  RecipientRequired,
} from "@ledgerhq/ledger-wallet-framework/errors";
import BigNumber from "bignumber.js";
import type { HederaCoinConfig } from "../config";
import {
  HederaInvalidStakingNodeIdError,
  HederaNoStakingRewardsError,
  HederaRedundantStakingNodeIdError,
} from "../errors";
import type { HederaMemo } from "../types";
import { validateIntent } from "./validateIntent";

const mockEstimateFees = jest.fn();
jest.mock("./estimateFees", () => ({
  estimateFees: (...args: unknown[]) => mockEstimateFees(...args),
}));

const mockGetAccountInfo = jest.fn();
jest.mock("./getAccountInfo", () => ({
  getAccountInfo: (...args: unknown[]) => mockGetAccountInfo(...args),
}));

const mockGetNodes = jest.fn();
jest.mock("../network/api", () => ({
  apiClient: { getNodes: (...args: unknown[]) => mockGetNodes(...args) },
}));

const mockSafeParseAccountId = jest.fn();
jest.mock("../network/utils", () => ({
  safeParseAccountId: (...args: unknown[]) => mockSafeParseAccountId(...args),
}));

const CURRENCY_ID = "hedera";
const SENDER = "0.0.1111111";
const RECIPIENT = "0.0.2222222";
const mockConfig = {} as HederaCoinConfig;

function makeIntent(
  overrides: Partial<TransactionIntent<HederaMemo>> & { valId?: string } = {},
): TransactionIntent<HederaMemo> & { valId?: string } {
  return {
    intentType: "transaction",
    type: "send",
    sender: SENDER,
    recipient: RECIPIENT,
    amount: 100n,
    asset: { type: "native", name: "Hedera", unit: { name: "HBAR", code: "HBAR", magnitude: 8 } },
    useAllAmount: false,
    memo: { type: "NO_MEMO" },
    ...overrides,
  } as TransactionIntent<HederaMemo> & { valId?: string };
}

const nativeBalance = (value: bigint): Balance => ({ value, asset: { type: "native" } });
const htsBalance = (value: bigint): Balance => ({
  value,
  asset: { type: "hts", assetReference: "0.0.999999" },
});

beforeEach(() => {
  jest.clearAllMocks();
  mockEstimateFees.mockResolvedValue({ tinybars: new BigNumber(10) });
  mockSafeParseAccountId.mockImplementation(({ address }: { address: string }) =>
    Promise.resolve([null, { accountId: address, checksum: null }]),
  );
  mockGetAccountInfo.mockResolvedValue({
    type: "hedera",
    maxAutomaticTokenAssociations: 0,
    stakedNodeId: null,
    balance: 1000,
    pendingReward: 0,
  });
  mockGetNodes.mockResolvedValue({
    nodes: [{ node_id: 1 }, { node_id: 2 }],
    nextCursor: null,
  });
});

describe("validateIntent — native send", () => {
  it("completes successfully with a valid recipient and enough balance", async () => {
    const result = await validateIntent(CURRENCY_ID, mockConfig, makeIntent(), [
      nativeBalance(1000n),
    ]);

    expect(result.errors).toEqual({});
    expect(result.amount).toBe(100n);
    expect(result.totalSpent).toBe(110n);
    expect(result.estimatedFees).toBe(10n);
  });

  it("requires an amount when not sending max", async () => {
    const result = await validateIntent(CURRENCY_ID, mockConfig, makeIntent({ amount: 0n }), [
      nativeBalance(1000n),
    ]);

    expect(result.errors.amount).toBeInstanceOf(AmountRequired);
  });

  it("reports not-enough-balance when the total exceeds the native balance", async () => {
    const result = await validateIntent(CURRENCY_ID, mockConfig, makeIntent({ amount: 1000n }), [
      nativeBalance(1000n),
    ]);

    expect(result.errors.amount).toBeInstanceOf(NotEnoughBalance);
  });

  it("requires a recipient", async () => {
    const result = await validateIntent(CURRENCY_ID, mockConfig, makeIntent({ recipient: "" }), [
      nativeBalance(1000n),
    ]);

    expect(result.errors.recipient).toBeInstanceOf(RecipientRequired);
  });

  it("rejects sending to the sender's own address", async () => {
    const result = await validateIntent(
      CURRENCY_ID,
      mockConfig,
      makeIntent({ recipient: SENDER }),
      [nativeBalance(1000n)],
    );

    expect(result.errors.recipient).toBeInstanceOf(InvalidAddressBecauseDestinationIsAlsoSource);
  });
});

describe("validateIntent — HTS token transfer", () => {
  const tokenAsset = {
    type: "hts" as const,
    assetReference: "0.0.999999",
    name: "T",
    unit: { name: "T", code: "T", magnitude: 0 },
  };

  it("completes successfully with enough token and native balance", async () => {
    const result = await validateIntent(
      CURRENCY_ID,
      mockConfig,
      makeIntent({ asset: tokenAsset, amount: 50n }),
      [nativeBalance(1000n), htsBalance(100n)],
    );

    expect(result.errors).toEqual({});
    expect(result.amount).toBe(50n);
  });

  it("reports not-enough-balance when the token balance is insufficient", async () => {
    const result = await validateIntent(
      CURRENCY_ID,
      mockConfig,
      makeIntent({ asset: tokenAsset, amount: 500n }),
      [nativeBalance(1000n), htsBalance(100n)],
    );

    expect(result.errors.amount).toBeInstanceOf(NotEnoughBalance);
  });

  it("reports not-enough-balance when the native balance can't cover the fee", async () => {
    const result = await validateIntent(
      CURRENCY_ID,
      mockConfig,
      makeIntent({ asset: tokenAsset, amount: 50n }),
      [nativeBalance(5n), htsBalance(100n)],
    );

    expect(result.errors.amount).toBeInstanceOf(NotEnoughBalance);
  });
});

describe("validateIntent — changeTrust (association)", () => {
  // `computeIntentType` (families/hedera/bridge/api.ts) translates the generic "changeTrust" mode to
  // this legacy string before validateIntent ever runs — see it exercised end-to-end in
  // ledger-live-common's families/hedera/genericFlip.test.ts.
  it("estimates the association fee without erroring", async () => {
    const result = await validateIntent(
      CURRENCY_ID,
      mockConfig,
      makeIntent({ type: "token-associate" }),
      [nativeBalance(1000n)],
    );

    expect(result.errors).toEqual({});
    expect(result.amount).toBe(0n);
  });
});

describe("validateIntent — staking", () => {
  it("delegate with a valid node id completes successfully", async () => {
    const result = await validateIntent(
      CURRENCY_ID,
      mockConfig,
      makeIntent({ type: "delegate", valId: "1" }),
      [nativeBalance(1000n)],
    );

    expect(result.errors).toEqual({});
    expect(result.amount).toBe(0n);
  });

  it("requires a staking node id for delegate", async () => {
    const result = await validateIntent(CURRENCY_ID, mockConfig, makeIntent({ type: "delegate" }), [
      nativeBalance(1000n),
    ]);

    expect(result.errors.missingStakingNodeId).toBeInstanceOf(HederaInvalidStakingNodeIdError);
  });

  it("rejects an unknown staking node id for delegate", async () => {
    const result = await validateIntent(
      CURRENCY_ID,
      mockConfig,
      makeIntent({ type: "delegate", valId: "999" }),
      [nativeBalance(1000n)],
    );

    expect(result.errors.stakingNodeId).toBeInstanceOf(HederaInvalidStakingNodeIdError);
  });

  it("rejects redelegating to the node already delegated to", async () => {
    mockGetAccountInfo.mockResolvedValue({
      type: "hedera",
      maxAutomaticTokenAssociations: 0,
      stakedNodeId: 1,
      balance: 1000,
      pendingReward: 0,
    });

    const result = await validateIntent(
      CURRENCY_ID,
      mockConfig,
      makeIntent({ type: "redelegate", valId: "1" }),
      [nativeBalance(1000n)],
    );

    expect(result.errors.stakingNodeId).toBeInstanceOf(HederaRedundantStakingNodeIdError);
  });

  it("does not require a staking node id for undelegate", async () => {
    const result = await validateIntent(
      CURRENCY_ID,
      mockConfig,
      makeIntent({ type: "undelegate" }),
      [nativeBalance(1000n)],
    );

    expect(result.errors.missingStakingNodeId).toBeUndefined();
    expect(result.errors.stakingNodeId).toBeUndefined();
  });

  it.each(["delegate", "undelegate", "redelegate", "claimReward"])(
    "reports the fee key when the native balance can't cover a %s transaction's fee",
    async type => {
      const result = await validateIntent(
        CURRENCY_ID,
        mockConfig,
        makeIntent({ type, valId: "1" }),
        [nativeBalance(0n)],
      );

      expect(result.errors.fee).toBeInstanceOf(NotEnoughBalance);
    },
  );

  it("blocks claiming rewards when there is nothing to claim", async () => {
    const result = await validateIntent(
      CURRENCY_ID,
      mockConfig,
      makeIntent({ type: "claimReward" }),
      [nativeBalance(1000n)],
    );

    expect(result.errors.noRewardsToClaim).toBeInstanceOf(HederaNoStakingRewardsError);
  });

  it("allows claiming rewards when a reward is pending", async () => {
    mockGetAccountInfo.mockResolvedValue({
      type: "hedera",
      maxAutomaticTokenAssociations: 0,
      stakedNodeId: 1,
      balance: 1000,
      pendingReward: 42,
    });

    const result = await validateIntent(
      CURRENCY_ID,
      mockConfig,
      makeIntent({ type: "claimReward" }),
      [nativeBalance(1000n)],
    );

    expect(result.errors.noRewardsToClaim).toBeUndefined();
  });
});
