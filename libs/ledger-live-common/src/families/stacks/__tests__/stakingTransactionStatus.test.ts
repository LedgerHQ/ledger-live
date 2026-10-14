import BigNumber from "bignumber.js";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import { getTransactionStatus as classicGetTransactionStatus } from "@ledgerhq/coin-stacks/bridge/getTransactionStatus";
import { fetchPoxInfo } from "@ledgerhq/coin-stacks/network/pox";
import { genericGetTransactionStatus } from "../../../bridge/generic-coin-framework/getTransactionStatus";
import type { StacksAccount, Transaction } from "../types";

// validateIntent reads /v2/pox for the prepare-phase check; keep these cases off the network.
jest.mock("@ledgerhq/coin-stacks/network/pox");

const mockNextCycle = (blocksUntilPreparePhase: number, blocksUntilRewardPhase: number) =>
  jest.mocked(fetchPoxInfo).mockResolvedValue({
    next_cycle: {
      blocks_until_prepare_phase: blocksUntilPreparePhase,
      blocks_until_reward_phase: blocksUntilRewardPhase,
    },
  } as Awaited<ReturnType<typeof fetchPoxInfo>>);

const POOL_ADDRESS = "SPNX9YY3T4GR4XDSNRVWB2MDQVCTJMP3BGT7VCZA.native-pool-signer-manager";
const FEE = new BigNumber(180);

const account: StacksAccount = {
  ...genAccount("stacks-staking-status", { currency: getCryptoCurrencyById("stacks") }),
  balance: new BigNumber(10_000_000),
  spendableBalance: new BigNumber(10_000_000),
  pendingOperations: [],
  subAccounts: [],
};

// The transactions the mobile and desktop staking screens hand to the device step.
const delegateTransaction: Transaction = {
  family: "stacks",
  amount: new BigNumber(1_000_000),
  recipient: "",
  network: "mainnet",
  anchorMode: 3,
  fee: FEE,
  fees: FEE,
  mode: "delegate",
  valAddress: POOL_ADDRESS,
  familySpecificData: { numCycles: 6, startBurnHt: 900_123 },
};

const undelegateTransaction: Transaction = {
  ...delegateTransaction,
  amount: new BigNumber(0),
  mode: "undelegate",
  familySpecificData: undefined,
};

const genericStatus = genericGetTransactionStatus("stacks", "local");

describe("Stacks staking transactions on the generic bridge", () => {
  beforeEach(() => {
    // Reward phase: 300 blocks until the next prepare phase.
    mockNextCycle(300, 400);
  });

  it("validates a complete delegate transaction without errors", async () => {
    const status = await genericStatus(account, delegateTransaction);

    expect(status.errors).toEqual({});
    expect(status.amount).toEqual(new BigNumber(1_000_000));
    expect(status.totalSpent).toEqual(new BigNumber(1_000_180));
  });

  it("validates an undelegate transaction without errors", async () => {
    const status = await genericStatus(account, undelegateTransaction);

    expect(status.errors).toEqual({});
    expect(status.totalSpent).toEqual(FEE);
  });

  it("rejects a delegate transaction whose startBurnHt has not resolved yet", async () => {
    const status = await genericStatus(account, {
      ...delegateTransaction,
      familySpecificData: { numCycles: 6 },
    });

    expect(status.errors.data).toBeDefined();
  });

  it("rejects a delegate transaction during the pox-5 prepare phase", async () => {
    mockNextCycle(0, 42);

    const status = await genericStatus(account, delegateTransaction);

    expect(status.errors.data?.name).toBe("StacksStakeInPreparePhase");
  });

  it("rejects a delegate amount above the spendable balance minus fees", async () => {
    const status = await genericStatus(account, {
      ...delegateTransaction,
      amount: new BigNumber(10_000_000),
    });

    expect(status.errors.amount?.name).toBe("NotEnoughBalance");
  });
});

describe("Stacks staking transactions on the classic bridge", () => {
  it.each([
    ["delegate", delegateTransaction],
    ["undelegate", undelegateTransaction],
  ])("blocks the %s transaction so it cannot be signed as a transfer", async (_, tx) => {
    const status = await classicGetTransactionStatus(account, tx);

    expect(status.errors.recipient).toBeDefined();
  });
});
