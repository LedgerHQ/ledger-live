import BigNumber from "bignumber.js";
import type { Scenario } from "@ledgerhq/coin-tester/main";
import type {
  AleoAccount,
  AleoOperation,
  Transaction as AleoTransaction,
} from "@ledgerhq/coin-aleo/types";
import { TRANSACTION_TYPE } from "@ledgerhq/coin-aleo/constants";
import {
  ALEO,
  RECORD_A_MICROCREDITS,
  RECORD_B_MICROCREDITS,
  TRANSFER_AMOUNT_MICROCREDITS,
  generateAleoAccount,
  makePrivateAleoAccount,
  type GeneratedAleoAccount,
} from "../fixtures";
import { getPublicBalance } from "../devnode";
import { createAleoHarness, newOperations, type AleoStep } from "../helpers";
import { getSponsoredFee } from "../msw/sponsor";
import { fundFromGenesis } from "../testSetup";

const harness = createAleoHarness();

let sender: GeneratedAleoAccount;
let recipient: GeneratedAleoAccount;

const convertRecord = (amount: number, label: string): AleoStep => ({
  transaction: {
    name: `Convert ${amount} microcredits from public to private (${label})`,
    mode: TRANSACTION_TYPE.CONVERT_PUBLIC_TO_PRIVATE,
    amount: new BigNumber(amount),
    expect: (previous, current) => {
      const operations = newOperations(previous, current) as AleoOperation[];
      // A conversion is a self-transfer, so the bridge shows a public OUT and a private IN for it.
      expect(operations).toHaveLength(2);
      const publicSideOps = operations.filter(op => op.extra.transactionType === "public");
      const privateSideOps = operations.filter(op => op.extra.transactionType === "private");
      expect(publicSideOps).toHaveLength(1);
      expect(privateSideOps).toHaveLength(1);
      const [publicSide] = publicSideOps;
      const [privateSide] = privateSideOps;

      expect(publicSide.type).toBe("OUT");
      expect(publicSide.hasFailed).toBe(false);
      expect(publicSide.senders).toStrictEqual([sender.address]);
      expect(publicSide.recipients).toStrictEqual([sender.address]);

      expect(privateSide.type).toBe("IN");
      expect(privateSide.hasFailed).toBe(false);
      expect(privateSide.hash).toBe(publicSide.hash);
      expect(privateSide.senders).toStrictEqual([sender.address]);
      expect(privateSide.recipients).toStrictEqual([sender.address]);
      expect(privateSide.value).toStrictEqual(new BigNumber(amount));

      expect(publicSide.fee.toNumber()).toBe(getSponsoredFee(publicSide.hash));
      expect(publicSide.value).toStrictEqual(new BigNumber(amount));

      expect(current.balance).toStrictEqual(previous.balance);

      const previousUnspent = previous.aleoResources?.unspentPrivateRecords ?? [];
      const currentUnspent = current.aleoResources?.unspentPrivateRecords ?? [];
      expect(currentUnspent).toHaveLength(previousUnspent.length + 1);

      // Distinct amounts keep record A and record B distinguishable when sendPrivate spends them.
      const previousCommitments = new Set(previousUnspent.map(record => record.commitment));
      const [minted] = currentUnspent.filter(record => !previousCommitments.has(record.commitment));
      expect(minted.microcredits).toBe(String(amount));

      expect(current.pendingOperations).toStrictEqual([]);
    },
  },
  signs: () => ({ recipient: sender.address, amount }),
});

const convertRecordA = convertRecord(
  RECORD_A_MICROCREDITS,
  "record A, spent as the transfer's amount record",
);
const convertRecordB = convertRecord(
  RECORD_B_MICROCREDITS,
  "record B, a second record the sponsored transfer must leave unspent",
);

const sendPrivate: AleoStep = {
  transaction: {
    name: `Send ${TRANSFER_AMOUNT_MICROCREDITS} microcredits privately to a fresh recipient`,
    mode: TRANSACTION_TYPE.TRANSFER_PRIVATE,
    amount: new BigNumber(TRANSFER_AMOUNT_MICROCREDITS),
    // Filled in by prepareTransaction (auto record picking); the type requires the field.
    properties: { amountRecordCommitments: [], feeRecordCommitment: null },
    get recipient() {
      return recipient.address;
    },
    expect: (previous, current) => {
      const operations = newOperations(previous, current) as AleoOperation[];
      expect(operations).toHaveLength(1);
      const [latest] = operations;

      expect(latest.type).toBe("OUT");
      expect(latest.hasFailed).toBe(false);
      expect(latest.extra.transactionType).toBe("private");
      expect(latest.senders).toStrictEqual([sender.address]);
      expect(latest.recipients).toStrictEqual([recipient.address]);

      expect(latest.fee.toNumber()).toBe(getSponsoredFee(latest.hash));
      expect(latest.value).toStrictEqual(new BigNumber(TRANSFER_AMOUNT_MICROCREDITS));

      expect(previous.aleoResources?.privateBalance).not.toBeNull();
      const previousPrivateBalance = previous.aleoResources!.privateBalance!;
      expect(current.aleoResources?.privateBalance).toStrictEqual(
        previousPrivateBalance.minus(TRANSFER_AMOUNT_MICROCREDITS),
      );
      expect(current.balance).toStrictEqual(previous.balance.minus(TRANSFER_AMOUNT_MICROCREDITS));

      // Sponsored fee: record A pays the amount and is replaced by its change, record B stays unspent.
      const previousUnspent = previous.aleoResources?.unspentPrivateRecords ?? [];
      const recordA = previousUnspent.find(
        record => record.microcredits === String(RECORD_A_MICROCREDITS),
      );
      const recordB = previousUnspent.find(
        record => record.microcredits === String(RECORD_B_MICROCREDITS),
      );
      expect(recordA).toBeDefined();
      expect(recordB).toBeDefined();

      const currentUnspent = current.aleoResources?.unspentPrivateRecords ?? [];
      expect(currentUnspent).toHaveLength(2);
      expect(currentUnspent.map(record => record.commitment)).toContain(recordB!.commitment);
      expect(currentUnspent.map(record => record.commitment)).not.toContain(recordA!.commitment);
      const [change] = currentUnspent.filter(record => record.commitment !== recordB!.commitment);
      expect(change.microcredits).toBe(
        String(RECORD_A_MICROCREDITS - TRANSFER_AMOUNT_MICROCREDITS),
      );

      expect(current.pendingOperations).toStrictEqual([]);
    },
  },
  signs: () => ({ recipient: recipient.address, amount: TRANSFER_AMOUNT_MICROCREDITS }),
};

const steps = [convertRecordA, convertRecordB, sendPrivate];

export const scenarioTransferPrivate: Scenario<AleoTransaction, AleoAccount> = {
  name: "Ledger Live Aleo — private credit transfer",

  // Must not touch docker: spawnStack runs `compose down --volumes` and would kill the shared stack.
  setup: async () => {
    [sender, recipient] = await Promise.all([generateAleoAccount(), generateAleoAccount()]);
    await fundFromGenesis(sender.address, RECORD_A_MICROCREDITS + RECORD_B_MICROCREDITS);

    return harness.setup({
      sender,
      account: makePrivateAleoAccount(sender.address, sender.viewKey),
      steps,
      scanned: [sender, recipient],
    });
  },

  beforeSync: harness.beforeSync,

  getTransactions: () => steps.map(step => step.transaction),

  beforeEach: harness.beforeEach,

  beforeAll: account => {
    expect(account.currency.id).toBe(ALEO.id);
    expect(account.freshAddress).toBe(sender.address);
    expect(account.balance).toStrictEqual(
      new BigNumber(RECORD_A_MICROCREDITS + RECORD_B_MICROCREDITS),
    );
    expect(account.aleoResources?.privateBalance).toStrictEqual(new BigNumber(0));
    // The funding IN.
    expect(account.operationsCount).toBe(1);
  },

  afterAll: async account => {
    // Funding IN, two ops per conversion, one private OUT.
    expect(account.operationsCount).toBe(1 + 2 + 2 + 1);
    expect(await getPublicBalance(recipient.address)).toBe(0n);

    const recipientAccount = await harness.sync(
      makePrivateAleoAccount(recipient.address, recipient.viewKey),
    );

    const privateOperations = (recipientAccount.operations as AleoOperation[]).filter(
      op => op.extra.transactionType === "private",
    );
    expect(privateOperations).toHaveLength(1);
    const [latest] = privateOperations;
    expect(latest.type).toBe("IN");
    expect(latest.hasFailed).toBe(false);
    expect(latest.recipients).toStrictEqual([recipient.address]);
    expect(latest.value).toStrictEqual(new BigNumber(TRANSFER_AMOUNT_MICROCREDITS));
    expect(recipientAccount.aleoResources?.privateBalance).toStrictEqual(
      new BigNumber(TRANSFER_AMOUNT_MICROCREDITS),
    );
  },

  teardown: harness.teardown,
};
