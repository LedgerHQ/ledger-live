import BigNumber from "bignumber.js";
import { setupServer } from "msw/node";
import type { AccountBridge } from "@ledgerhq/types-live";
import type { Scenario, ScenarioTransaction } from "@ledgerhq/coin-tester/main";
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
  buildAleoCoinConfig,
  generateAleoAccount,
  makePrivateAleoAccount,
  type GeneratedAleoAccount,
} from "../fixtures";
import { advanceBlocks, getPublicBalance } from "../devnode";
import { getBridges } from "../helpers";
import { buildAleoHandlers, buildScannerHandlers } from "../msw/handlers";
import type { ExpectedTransfer } from "../msw/prove";
import { createRecordStore, makeRecordResolver, type RecordStore } from "../msw/records";
import { createFakeScanner } from "../msw/scanner";
import { getSponsoredFee } from "../msw/sponsor";
import { buildMockAleoSigner } from "../signer";
import { fundFromGenesis, startMockServer, syncAccount } from "../testSetup";

const mockServer = setupServer();

let sender: GeneratedAleoAccount;
let recipient: GeneratedAleoAccount;
let accountBridge: AccountBridge<AleoTransaction, AleoAccount>;

// Shared by the signer's record resolver and the prove handler so both see the same plaintexts.
let senderStore: RecordStore;

// What the prove handler checks the transaction in flight against; beforeEach advances it.
let expected: ExpectedTransfer;
let pendingExpectations: ExpectedTransfer[] = [];

const convertRecord = (
  amount: number,
  label: string,
): ScenarioTransaction<AleoTransaction, AleoAccount> => ({
  name: `Convert ${amount} microcredits from public to private (${label})`,
  mode: TRANSACTION_TYPE.CONVERT_PUBLIC_TO_PRIVATE,
  amount: new BigNumber(amount),
  expect: (previous, current) => {
    const newOperations = (current.operations as AleoOperation[]).filter(
      currentOp => !previous.operations.some(previousOp => previousOp.id === currentOp.id),
    );
    // A conversion is a self-transfer, so the bridge shows a public OUT and a private IN for it.
    expect(newOperations).toHaveLength(2);
    const publicSideOps = newOperations.filter(op => op.extra.transactionType === "public");
    const privateSideOps = newOperations.filter(op => op.extra.transactionType === "private");
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

    // Pins develop: the optimistic op had fee 0; aligning it is left to the fee-sponsoring epic.
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
});

const convertRecordA = convertRecord(
  RECORD_A_MICROCREDITS,
  "record A, spent as the transfer's amount record",
);
const convertRecordB = convertRecord(
  RECORD_B_MICROCREDITS,
  "record B, a second record the sponsored transfer must leave unspent",
);

const sendPrivate: ScenarioTransaction<AleoTransaction, AleoAccount> = {
  name: `Send ${TRANSFER_AMOUNT_MICROCREDITS} microcredits privately to a fresh recipient`,
  mode: TRANSACTION_TYPE.TRANSFER_PRIVATE,
  amount: new BigNumber(TRANSFER_AMOUNT_MICROCREDITS),
  // Filled in by prepareTransaction (auto record picking); the type requires the field.
  properties: { amountRecordCommitments: [], feeRecordCommitment: null },
  get recipient() {
    return recipient.address;
  },
  expect: (previous, current) => {
    const newOperations = (current.operations as AleoOperation[]).filter(
      currentOp => !previous.operations.some(previousOp => previousOp.id === currentOp.id),
    );
    expect(newOperations).toHaveLength(1);
    const [latest] = newOperations;

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
    expect(change.microcredits).toBe(String(RECORD_A_MICROCREDITS - TRANSFER_AMOUNT_MICROCREDITS));

    expect(current.pendingOperations).toStrictEqual([]);
  },
};

// Each transaction next to what its prove request must sign, so the two cannot drift apart.
const steps: [
  transaction: ScenarioTransaction<AleoTransaction, AleoAccount>,
  expectation: () => ExpectedTransfer,
][] = [
  [
    convertRecordA,
    () => ({
      recipient: sender.address,
      amount: RECORD_A_MICROCREDITS,
      senderPrivateKey: sender.privateKey,
    }),
  ],
  [
    convertRecordB,
    () => ({
      recipient: sender.address,
      amount: RECORD_B_MICROCREDITS,
      senderPrivateKey: sender.privateKey,
    }),
  ],
  [
    sendPrivate,
    () => ({
      recipient: recipient.address,
      amount: TRANSFER_AMOUNT_MICROCREDITS,
      senderPrivateKey: sender.privateKey,
      privateRecordStore: senderStore,
    }),
  ],
];

export const scenarioTransferPrivate: Scenario<AleoTransaction, AleoAccount> = {
  name: "Ledger Live Aleo — private credit transfer",

  // Must not touch docker: spawnStack runs `compose down --volumes` and would kill the shared stack.
  setup: async () => {
    [sender, recipient] = await Promise.all([generateAleoAccount(), generateAleoAccount()]);

    senderStore = createRecordStore({
      viewKey: sender.viewKey,
      address: sender.address,
    });

    const scanner = createFakeScanner();
    await scanner.setup();
    scanner.registerAccount({
      viewKey: sender.viewKey,
      address: sender.address,
    });
    scanner.registerAccount({
      viewKey: recipient.viewKey,
      address: recipient.address,
    });

    startMockServer(mockServer);

    pendingExpectations = steps.map(([, expectation]) => expectation());
    mockServer.use(...buildAleoHandlers(() => expected), ...buildScannerHandlers(scanner));

    await fundFromGenesis(sender.address, RECORD_A_MICROCREDITS + RECORD_B_MICROCREDITS);

    const signer = buildMockAleoSigner(sender.privateKey, makeRecordResolver(senderStore));
    const bridges = getBridges(signer, buildAleoCoinConfig());
    accountBridge = bridges.accountBridge;

    return {
      currencyBridge: bridges.currencyBridge,
      accountBridge,
      account: makePrivateAleoAccount(sender.address, sender.viewKey),
      retryInterval: 1000,
      retryLimit: 20,
    };
  },

  // A devnode has no consensus, so every sync attempt must seal its own block.
  beforeSync: async () => {
    await advanceBlocks(1);
    await senderStore.refresh();
  },

  getTransactions: () => steps.map(([transaction]) => transaction),

  beforeEach: () => {
    const next = pendingExpectations.shift();
    if (!next) {
      throw new Error("aleo coin-tester: a transaction ran with no expectation queued for it");
    }
    expected = next;
  },

  beforeAll: account => {
    expect(account.currency.id).toBe(ALEO.id);
    expect(account.freshAddress).toBe(sender.address);
    expect(account.aleoResources?.privateBalance).toStrictEqual(new BigNumber(0));
  },

  afterAll: async () => {
    expect(await getPublicBalance(recipient.address)).toBe(0n);

    // The harness only syncs `sender`, so the IN side is synced by hand.
    const recipientAccount = await syncAccount(
      accountBridge,
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

  // The docker stack belongs to scenarii.test.ts.
  teardown: () => {
    mockServer.close();
  },
};
