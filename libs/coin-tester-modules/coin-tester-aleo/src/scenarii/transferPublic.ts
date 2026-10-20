import BigNumber from "bignumber.js";
import type { Scenario } from "@ledgerhq/coin-tester/main";
import type { AleoAccount, Transaction as AleoTransaction } from "@ledgerhq/coin-aleo/types";
import {
  ALEO,
  FUNDING_AMOUNT_MICROCREDITS,
  TRANSFER_AMOUNT_MICROCREDITS,
  generateAleoAccount,
  makeAleoAccount,
  type GeneratedAleoAccount,
} from "../fixtures";
import { getPublicBalance } from "../devnode";
import { createAleoHarness, newOperations, type AleoStep } from "../helpers";
import { getSponsoredFee } from "../msw/sponsor";
import { fundFromGenesis } from "../testSetup";

const harness = createAleoHarness();

let sender: GeneratedAleoAccount;
let recipient: GeneratedAleoAccount;

const SEND_MAX_AMOUNT_MICROCREDITS = FUNDING_AMOUNT_MICROCREDITS - TRANSFER_AMOUNT_MICROCREDITS;

function expectPublicOut(previous: AleoAccount, current: AleoAccount, amount: number): void {
  const operations = newOperations(previous, current);
  expect(operations).toHaveLength(1);
  const [latest] = operations;

  expect(latest.type).toBe("OUT");
  expect(latest.hasFailed).toBe(false);
  expect(latest.recipients).toStrictEqual([recipient.address]);
  expect(latest.senders).toStrictEqual([sender.address]);
  // The optimistic op says fee 0; the synced one carries what the fee master paid.
  expect(latest.fee.toNumber()).toBe(getSponsoredFee(latest.hash));
  expect(latest.value).toStrictEqual(new BigNumber(amount));

  expect(current.balance).toStrictEqual(previous.balance.minus(amount));
  expect(current.pendingOperations).toStrictEqual([]);
}

const send: AleoStep = {
  transaction: {
    name: `Send ${TRANSFER_AMOUNT_MICROCREDITS} microcredits to a fresh recipient`,
    amount: new BigNumber(TRANSFER_AMOUNT_MICROCREDITS),
    get recipient() {
      return recipient.address;
    },
    expect: (previous, current) => expectPublicOut(previous, current, TRANSFER_AMOUNT_MICROCREDITS),
  },
  signs: () => ({ recipient: recipient.address, amount: TRANSFER_AMOUNT_MICROCREDITS }),
};

// Send max comes last: it drains the account.
const sendMax: AleoStep = {
  transaction: {
    name: "Send the remaining public balance to the same recipient",
    useAllAmount: true,
    get recipient() {
      return recipient.address;
    },
    expect: (previous, current) => {
      // The fee is sponsored, so send-max moves the whole balance.
      expectPublicOut(previous, current, SEND_MAX_AMOUNT_MICROCREDITS);
      expect(current.balance).toStrictEqual(new BigNumber(0));
    },
  },
  signs: () => ({ recipient: recipient.address, amount: SEND_MAX_AMOUNT_MICROCREDITS }),
};

const steps = [send, sendMax];

export const scenarioTransferPublic: Scenario<AleoTransaction, AleoAccount> = {
  name: "Ledger Live Aleo — public credit transfer and send-max",

  // Must not touch docker: spawnStack runs `compose down --volumes` and would kill the shared stack.
  setup: async () => {
    [sender, recipient] = await Promise.all([generateAleoAccount(), generateAleoAccount()]);
    await fundFromGenesis(sender.address, FUNDING_AMOUNT_MICROCREDITS);

    return harness.setup({
      sender,
      account: makeAleoAccount(sender.address, sender.viewKey),
      steps,
    });
  },

  beforeSync: harness.beforeSync,

  getTransactions: () => steps.map(step => step.transaction),

  beforeEach: harness.beforeEach,

  beforeAll: account => {
    expect(account.currency.id).toBe(ALEO.id);
    expect(account.freshAddress).toBe(sender.address);
    expect(account.balance).toStrictEqual(new BigNumber(FUNDING_AMOUNT_MICROCREDITS));
    // The funding IN.
    expect(account.operationsCount).toBe(1);
    expect(account.operations[0].type).toBe("IN");
  },

  afterAll: async account => {
    expect(account.operationsCount).toBe(1 + steps.length);
    expect(await getPublicBalance(sender.address)).toBe(0n);
    expect(await getPublicBalance(recipient.address)).toBe(BigInt(FUNDING_AMOUNT_MICROCREDITS));

    const recipientAccount = await harness.sync(
      makeAleoAccount(recipient.address, recipient.viewKey),
    );

    expect(recipientAccount.operations).toHaveLength(steps.length);
    for (const operation of recipientAccount.operations) {
      expect(operation.type).toBe("IN");
      expect(operation.hasFailed).toBe(false);
      expect(operation.senders).toStrictEqual([sender.address]);
      expect(operation.recipients).toStrictEqual([recipient.address]);
    }
    expect(recipientAccount.balance).toStrictEqual(new BigNumber(FUNDING_AMOUNT_MICROCREDITS));
  },

  teardown: harness.teardown,
};
