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
  GENESIS_ACCOUNT,
  RECORD_A_MICROCREDITS,
  RECORD_B_MICROCREDITS,
  TRANSFER_AMOUNT_MICROCREDITS,
  generateAleoAccount,
  makePrivateAleoAccount,
  type GeneratedAleoAccount,
} from "../fixtures";
import { getPublicBalance } from "../devnode";
import { createAleoHarness, newOperations, type AleoStep } from "../helpers";
import { mintPrivateRecord } from "../mint";
import { getSponsoredFee } from "../msw/sponsor";

const harness = createAleoHarness();

let sender: GeneratedAleoAccount;

const RECORD_COUNT_BEFORE_UNSHIELD = 2;

const unshield: AleoStep = {
  transaction: {
    name: `Unshield ${TRANSFER_AMOUNT_MICROCREDITS} microcredits from a private record back to the public balance`,
    mode: TRANSACTION_TYPE.CONVERT_PRIVATE_TO_PUBLIC,
    amount: new BigNumber(TRANSFER_AMOUNT_MICROCREDITS),
    // Filled in by prepareTransaction (auto record picking); the type requires the field.
    properties: { amountRecordCommitments: [], feeRecordCommitment: null },
    // No `recipient`: prepareTransaction pins it to account.freshAddress for CONVERT_ modes.
    expect: (previous, current) => {
      const operations = newOperations(previous, current) as AleoOperation[];
      // An unshield is a self-transfer, so the bridge shows a public IN and a private OUT for it.
      expect(operations).toHaveLength(2);
      const publicSideOps = operations.filter(op => op.extra.transactionType === "public");
      const privateSideOps = operations.filter(op => op.extra.transactionType === "private");
      expect(publicSideOps).toHaveLength(1);
      expect(privateSideOps).toHaveLength(1);
      const [publicSide] = publicSideOps;
      const [privateSide] = privateSideOps;

      expect(publicSide.type).toBe("IN");
      expect(publicSide.hasFailed).toBe(false);
      expect(publicSide.extra.functionId).toBe("transfer_private_to_public");
      expect(publicSide.senders).toStrictEqual([sender.address]);
      expect(publicSide.recipients).toStrictEqual([sender.address]);
      expect(publicSide.value).toStrictEqual(new BigNumber(TRANSFER_AMOUNT_MICROCREDITS));

      expect(privateSide.type).toBe("OUT");
      expect(privateSide.hasFailed).toBe(false);
      expect(privateSide.hash).toBe(publicSide.hash);
      expect(privateSide.senders).toStrictEqual([sender.address]);
      expect(privateSide.recipients).toStrictEqual([sender.address]);

      expect(privateSide.fee.toNumber()).toBe(getSponsoredFee(privateSide.hash));
      expect(publicSide.fee).toStrictEqual(privateSide.fee);
      expect(privateSide.value).toStrictEqual(new BigNumber(TRANSFER_AMOUNT_MICROCREDITS));

      const previousTransparentBalance =
        previous.aleoResources?.transparentBalance ?? new BigNumber(0);
      expect(current.aleoResources?.transparentBalance).toStrictEqual(
        previousTransparentBalance.plus(TRANSFER_AMOUNT_MICROCREDITS),
      );

      expect(previous.aleoResources?.privateBalance).not.toBeNull();
      const previousPrivateBalance = previous.aleoResources!.privateBalance!;
      expect(current.aleoResources?.privateBalance).toStrictEqual(
        previousPrivateBalance.minus(TRANSFER_AMOUNT_MICROCREDITS),
      );

      expect(current.balance).toStrictEqual(previous.balance);

      // Sponsored fee: record A pays the amount and is replaced by its change, record B stays unspent.
      const previousUnspent = previous.aleoResources?.unspentPrivateRecords ?? [];
      expect(previousUnspent).toHaveLength(RECORD_COUNT_BEFORE_UNSHIELD);
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

      expect(current.pendingOperations).toStrictEqual([]);
    },
  },
  signs: () => ({ recipient: sender.address, amount: TRANSFER_AMOUNT_MICROCREDITS }),
};

const steps = [unshield];

export const scenarioTransferPrivateToPublic: Scenario<AleoTransaction, AleoAccount> = {
  name: "Ledger Live Aleo — private credit unshield",

  // Must not touch docker: spawnStack runs `compose down --volumes` and would kill the shared stack.
  setup: async () => {
    sender = await generateAleoAccount();

    // Record A covers the amount; record B is too small to be picked and must stay unspent.
    await mintPrivateRecord(sender.address, RECORD_A_MICROCREDITS);
    await mintPrivateRecord(sender.address, RECORD_B_MICROCREDITS);

    return harness.setup({
      sender,
      account: makePrivateAleoAccount(sender.address, sender.viewKey),
      steps,
      scanned: [sender],
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
    expect(account.aleoResources?.transparentBalance).toStrictEqual(new BigNumber(0));
    expect(account.aleoResources?.privateBalance).toStrictEqual(
      new BigNumber(RECORD_A_MICROCREDITS + RECORD_B_MICROCREDITS),
    );
    expect(account.aleoResources?.unspentPrivateRecords).toHaveLength(RECORD_COUNT_BEFORE_UNSHIELD);
    expect(account.aleoResources?.provableApi?.uuid).toBeTruthy();
    expect(account.aleoResources?.lastPrivateSyncDate?.getTime()).toBeGreaterThan(0);

    // The mints are private INs only: their public side never names this account.
    expect(account.operationsCount).toBe(RECORD_COUNT_BEFORE_UNSHIELD);
    for (const operation of account.operations as AleoOperation[]) {
      expect(operation.type).toBe("IN");
      expect(operation.extra.transactionType).toBe("private");
      expect(operation.senders).toStrictEqual([GENESIS_ACCOUNT.address]);
      expect(operation.recipients).toStrictEqual([sender.address]);
    }
    const mintedValues = account.operations.map(operation => operation.value.toNumber());
    expect(mintedValues.sort((a, b) => a - b)).toStrictEqual([
      RECORD_B_MICROCREDITS,
      RECORD_A_MICROCREDITS,
    ]);
  },

  afterAll: async account => {
    // The two mints, then a public IN and a private OUT for the unshield.
    expect(account.operationsCount).toBe(RECORD_COUNT_BEFORE_UNSHIELD + 2);
    expect(await getPublicBalance(sender.address)).toBe(BigInt(TRANSFER_AMOUNT_MICROCREDITS));
    expect(account.aleoResources?.transparentBalance).toStrictEqual(
      new BigNumber(TRANSFER_AMOUNT_MICROCREDITS),
    );
  },

  teardown: harness.teardown,
};
