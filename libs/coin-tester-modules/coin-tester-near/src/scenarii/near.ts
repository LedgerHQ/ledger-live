import BigNumber from "bignumber.js";
import type { Account } from "@ledgerhq/types-live";
import { LiveConfig } from "@ledgerhq/live-config/LiveConfig";
import type { Scenario, ScenarioTransaction } from "@ledgerhq/coin-tester/main";
import type { GenericTransaction } from "@ledgerhq/live-common/bridge/generic-coin-framework/types";
import type { SetupServer } from "msw/node";
import {
  EPOCHS_TO_UNLOCK_BLOCKS,
  IMPLICIT_RECIPIENT_ID,
  NAMED_RECIPIENT_ID,
  NEAR,
  POOL_ID,
  RECIPIENT_BALANCE,
  SENDER_BALANCE,
  SENDER_ID,
  coinConfig,
  makeAccount,
} from "../fixtures";
import { getBridges } from "../helpers";
import { recordTransaction, resetIndexer, startIndexer } from "../indexer";
import { startSandbox, type SandboxHandle } from "../sandbox";
import { buildSigners, randomKeyPair } from "../signer";
import { deployStakingPool, pingPool } from "../stakingPool";

let sandbox: SandboxHandle | undefined;
let indexer: SetupServer | undefined;

/** Index of the next transaction, so the unstake lock can be skipped before the withdrawal. */
let step = 0;
const WITHDRAW_STEP = 4;

const has = (account: Account, type: string): boolean =>
  account.operations.some(operation => operation.type === type);

const countOf = (account: Account, type: string): number =>
  account.operations.filter(operation => operation.type === type).length;

const ONE_NEAR = new BigNumber((1n * NEAR).toString());
const FIVE_NEAR = new BigNumber((5n * NEAR).toString());
const TEN_NEAR = new BigNumber((10n * NEAR).toString());

type NearScenarioTransaction = ScenarioTransaction<GenericTransaction, Account>;

// Asserted against the balance, not the operation's `value`: the two bridges disagree on whether
// the fee is inside `value`, but `balance = previous - amount - fee` holds for both.
function makeTransactions(): NearScenarioTransaction[] {
  return [
    {
      name: "transfer to a named account",
      mode: "send",
      recipient: NAMED_RECIPIENT_ID,
      amount: ONE_NEAR,
      expect: (previous, current) => {
        const [latestOp] = current.operations;
        expect(latestOp.type).toBe("OUT");
        expect(latestOp.recipients).toContain(NAMED_RECIPIENT_ID);
        expect(latestOp.fee.gt(0)).toBe(true);
        expect(current.balance).toEqual(previous.balance.minus(ONE_NEAR).minus(latestOp.fee));
        expect(countOf(current, "OUT")).toBe(1);
      },
    },
    {
      name: "transfer to an implicit account that does not exist yet",
      mode: "send",
      recipient: IMPLICIT_RECIPIENT_ID,
      amount: ONE_NEAR,
      expect: (previous, current) => {
        const [implicitOp, namedOp] = current.operations;
        expect(implicitOp.type).toBe("OUT");
        expect(implicitOp.recipients).toContain(IMPLICIT_RECIPIENT_ID);
        expect(current.balance).toEqual(previous.balance.minus(ONE_NEAR).minus(implicitOp.fee));
        // Creating the account and its access key is charged on top of the transfer itself.
        expect(implicitOp.fee.gt(namedOp.fee)).toBe(true);
        expect(countOf(current, "OUT")).toBe(2);
      },
    },
    {
      name: "stake",
      mode: "stake",
      recipient: POOL_ID,
      amount: TEN_NEAR,
      expect: (previous, current) => {
        const [latestOp] = current.operations;
        expect(latestOp.type).toBe("STAKE");
        expect(latestOp.fee.gt(0)).toBe(true);
        // The stake leaves the spendable balance but stays in the total, which only pays the fee.
        expect(current.balance).toStrictEqual(previous.balance.minus(latestOp.fee));
        expect(current.spendableBalance).toStrictEqual(
          previous.spendableBalance.minus(TEN_NEAR).minus(latestOp.fee),
        );
        expect(current.spendableBalance.lt(current.balance)).toBe(true);
      },
    },
    {
      name: "unstake",
      mode: "unstake",
      recipient: POOL_ID,
      amount: FIVE_NEAR,
      expect: (previous, current) => {
        const [latestOp] = current.operations;
        expect(latestOp.type).toBe("UNSTAKE");
        expect(latestOp.fee.gt(0)).toBe(true);
        // Unstaking moves the principal between pool buckets; only the fee leaves the account.
        expect(previous.balance.minus(current.balance).lt(ONE_NEAR)).toBe(true);
      },
    },
    {
      name: "withdraw once the unstake lock has elapsed",
      mode: "withdraw",
      recipient: POOL_ID,
      amount: FIVE_NEAR,
      expect: (previous, current) => {
        const [latestOp] = current.operations;
        expect(latestOp.type).toBe("WITHDRAW_UNSTAKED");
        expect(latestOp.fee.gt(0)).toBe(true);
        expect(current.spendableBalance.gt(previous.spendableBalance)).toBe(true);
      },
    },
    {
      name: "send max to a named account",
      mode: "send",
      recipient: NAMED_RECIPIENT_ID,
      amount: new BigNumber(0),
      useAllAmount: true,
      expect: (_previous, current) => {
        const [latestOp] = current.operations;
        expect(latestOp.type).toBe("OUT");
        expect(latestOp.recipients).toContain(NAMED_RECIPIENT_ID);
        // The remaining 5 NEAR staked principal is untouched; only the spendable side drains.
        expect(current.spendableBalance.isZero()).toBe(true);
        expect(countOf(current, "OUT")).toBe(3);
      },
    },
  ];
}

export const scenarioNear: Scenario<GenericTransaction, Account> = {
  name: "NEAR",

  setup: async strategy => {
    sandbox = await startSandbox();

    // The generic bridge reads the endpoints from live-config, not from the coin module's own
    // setter, so both have to point at the sandbox for the two strategies to be comparable.
    LiveConfig.setConfig({
      config_currency_near: { type: "object", default: coinConfig(sandbox.rpcUrl)() },
    });

    await deployStakingPool(sandbox);

    const keyPair = randomKeyPair();
    await sandbox.createFundedAccount(SENDER_ID, SENDER_BALANCE, keyPair);
    await sandbox.createFundedAccount(NAMED_RECIPIENT_ID, RECIPIENT_BALANCE);

    indexer = startIndexer(sandbox.rpc);
    step = 0;

    const signers = buildSigners(SENDER_ID, keyPair);
    const { accountBridge, currencyBridge } = await getBridges(strategy, signers, sandbox.rpcUrl);

    return { account: makeAccount(SENDER_ID), accountBridge, currencyBridge, retryLimit: 20 };
  },

  getTransactions: () => makeTransactions(),

  beforeEach: async () => {
    // The pool releases an unstaked balance a fixed number of epochs later. Advancing the height is
    // the only way to reach it without waiting for real time to pass.
    if (step === WITHDRAW_STEP && sandbox) {
      await sandbox.fastForward(EPOCHS_TO_UNLOCK_BLOCKS);
      await pingPool(await sandbox.near.account(SENDER_ID));
    }
    step += 1;
  },

  mockIndexer: async (_account, optimistic) => {
    recordTransaction(optimistic.hash, SENDER_ID);
  },

  beforeAll: account => {
    // toFixed, not toString: BigNumber prints 1e21 and above in exponential form.
    expect(account.balance.toFixed()).toBe(SENDER_BALANCE.toString());
    expect(account.operations.length).toBe(0);
  },

  afterAll: account => {
    expect(countOf(account, "OUT")).toBe(3);
    expect(has(account, "STAKE")).toBe(true);
    expect(has(account, "UNSTAKE")).toBe(true);
    expect(has(account, "WITHDRAW_UNSTAKED")).toBe(true);
  },

  teardown: killSandbox,
};

// Exported so `scenarii.test.ts` can tear the sandbox down on a process kill signal, not just on
// the scenario's own (awaited) teardown hook.
export async function killSandbox(): Promise<void> {
  indexer?.close();
  resetIndexer();
  await sandbox?.tearDown();
  sandbox = undefined;
  indexer = undefined;
}
