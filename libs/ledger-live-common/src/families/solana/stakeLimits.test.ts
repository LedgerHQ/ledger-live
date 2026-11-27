import BigNumber from "bignumber.js";
import { LiveConfig } from "@ledgerhq/live-config/LiveConfig";
import { getChainAPI } from "@ledgerhq/coin-solana/network/index";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import type { Account, Operation, TransactionCommon } from "@ledgerhq/types-live";
import { liveConfig } from "../../config/sharedConfig";
import {
  computeSolanaStakeAmounts,
  readSolanaStakeAmountInputs,
  readSolanaStakeLimitInputs,
} from "./stakeLimits";

const mockChainApi = {
  getMinimumBalanceForRentExemption: jest.fn(),
  getStakeMinimumDelegation: jest.fn(),
};

jest.mock("@ledgerhq/coin-solana/network/index", () => ({
  ...jest.requireActual("@ledgerhq/coin-solana/network/index"),
  getChainAPI: jest.fn(() => mockChainApi),
}));

beforeAll(() => {
  LiveConfig.setConfig(liveConfig);
});

const lamports = (value: number) => new BigNumber(value);

function pendingOperation(type: Operation["type"], value: number, fee: number): Operation {
  return {
    id: `pending-${type}`,
    hash: `pending-${type}-hash`,
    type,
    value: lamports(value),
    fee: lamports(fee),
    senders: [],
    recipients: [],
    blockHeight: null,
    blockHash: null,
    accountId: "js:2:solana:HxCvgjSbF8HMt3fj8P3j49jmajNCMwKAqBu79HUDPtkM:solanaMain",
    date: new Date(0),
    extra: {},
  };
}

describe("computeSolanaStakeAmounts", () => {
  it("takes the stake account rent off the max spendable and derives the fee reserve", () => {
    const { maxStakeable, feeReserve } = computeSolanaStakeAmounts({
      rent: lamports(1_666_240),
      spendableBalance: lamports(50_929_500),
      pendingDebits: lamports(0),
      maxSpendable: lamports(50_909_500),
    });

    expect(maxStakeable.toFixed()).toBe("49243260");
    expect(feeReserve.toFixed()).toBe("20000");
  });

  it("keeps pending outgoing SOL out of the fee reserve", () => {
    const { maxStakeable, feeReserve } = computeSolanaStakeAmounts({
      rent: lamports(1_666_240),
      spendableBalance: lamports(600_000_000),
      pendingDebits: lamports(500_000_000),
      maxSpendable: lamports(99_980_000),
    });

    expect(maxStakeable.toFixed()).toBe("98313760");
    expect(feeReserve.toFixed()).toBe("20000");
  });

  it.each([
    ["the max spendable is below the rent", 980_000, 0],
    ["the max spendable is exactly the rent", 1_666_240, 0],
    ["one lamport stays above the rent", 1_666_241, 1],
  ])("answers the stakeable lamports when %s", (_name, maxSpendable, expected) => {
    const { maxStakeable } = computeSolanaStakeAmounts({
      rent: lamports(1_666_240),
      spendableBalance: lamports(2_000_000),
      pendingDebits: lamports(0),
      maxSpendable: lamports(maxSpendable),
    });

    expect(maxStakeable.toNumber()).toBe(expected);
  });

  it("never lets the fee reserve go below zero", () => {
    const { feeReserve } = computeSolanaStakeAmounts({
      rent: lamports(1_666_240),
      spendableBalance: lamports(1_000_000),
      pendingDebits: lamports(900_000),
      maxSpendable: lamports(0),
    });

    expect(feeReserve.toFixed()).toBe("0");
  });
});

describe("reading the stake amount inputs", () => {
  const account: Account = {
    ...genAccount("stake-limits", {
      currency: getCryptoCurrencyById("solana"),
      operationsSize: 0,
      subAccountsCount: 0,
    }),
    spendableBalance: lamports(50_929_500),
    pendingOperations: [
      pendingOperation("OUT", 500_000_000, 5_000),
      pendingOperation("FEES", 2_000_000, 5_000),
    ],
  };
  const transaction: TransactionCommon = { amount: lamports(0), recipient: "" };
  const estimateMaxSpendable = jest.fn();
  const bridge = { estimateMaxSpendable };

  beforeEach(() => {
    jest.clearAllMocks();
    mockChainApi.getMinimumBalanceForRentExemption.mockResolvedValue(1_666_240);
    mockChainApi.getStakeMinimumDelegation.mockResolvedValue(1_000_000_000);
    estimateMaxSpendable.mockResolvedValue(lamports(50_909_500));
  });

  it("gathers the rent, the balance, the pending debits and the bridge send-max", async () => {
    const inputs = await readSolanaStakeAmountInputs(account, bridge, transaction);

    expect(inputs.rent.toFixed()).toBe("1666240");
    expect(inputs.spendableBalance).toBe(account.spendableBalance);
    expect(inputs.pendingDebits.toFixed()).toBe("500010000");
    expect(inputs.maxSpendable.toFixed()).toBe("50909500");
    expect(estimateMaxSpendable).toHaveBeenCalledWith({ account, transaction });
  });

  it("counts no pending debit for an account without a list of pending operations", async () => {
    const withoutPendingOperations: Partial<Account> = { pendingOperations: undefined };

    const inputs = await readSolanaStakeAmountInputs(
      { ...account, ...withoutPendingOperations },
      bridge,
      transaction,
    );

    expect(inputs.pendingDebits.toFixed()).toBe("0");
  });

  it("does not ask for the minimum delegation, which the amount does not depend on", async () => {
    mockChainApi.getStakeMinimumDelegation.mockRejectedValue(new Error("not supported"));

    await expect(readSolanaStakeAmountInputs(account, bridge, transaction)).resolves.toBeDefined();
    expect(mockChainApi.getStakeMinimumDelegation).not.toHaveBeenCalled();
  });

  it("adds the minimum delegation for callers that explain a refused amount", async () => {
    const inputs = await readSolanaStakeLimitInputs(account, bridge, transaction);

    expect(inputs.minimumDelegation.toFixed()).toBe("1000000000");
    expect(inputs.rent.toFixed()).toBe("1666240");
  });

  it.each([
    [
      "the rent",
      () => mockChainApi.getMinimumBalanceForRentExemption.mockRejectedValue(new Error("rpc")),
    ],
    ["the bridge send-max", () => estimateMaxSpendable.mockRejectedValue(new Error("rpc"))],
  ])("rejects when %s cannot be read", async (_name, breakIt) => {
    breakIt();

    await expect(readSolanaStakeAmountInputs(account, bridge, transaction)).rejects.toThrow("rpc");
    await expect(readSolanaStakeLimitInputs(account, bridge, transaction)).rejects.toThrow("rpc");
  });

  it("rejects the limits when the minimum delegation cannot be read", async () => {
    mockChainApi.getStakeMinimumDelegation.mockRejectedValue(new Error("rpc"));

    await expect(readSolanaStakeLimitInputs(account, bridge, transaction)).rejects.toThrow("rpc");
  });

  it("opens one chain API connection for each read, whatever the number of figures", async () => {
    await readSolanaStakeLimitInputs(account, bridge, transaction);
    await readSolanaStakeAmountInputs(account, bridge, transaction);

    expect(jest.mocked(getChainAPI)).toHaveBeenCalledTimes(2);
  });
});
