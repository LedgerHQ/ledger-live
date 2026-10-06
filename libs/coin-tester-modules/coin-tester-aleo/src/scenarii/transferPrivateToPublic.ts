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
import { mintPrivateRecord } from "../mint";
import { buildAleoHandlers, buildScannerHandlers } from "../msw/handlers";
import type { ExpectedTransfer } from "../msw/prove";
import { createRecordStore, makeRecordResolver, type RecordStore } from "../msw/records";
import { createFakeScanner } from "../msw/scanner";
import { getSponsoredFee } from "../msw/sponsor";
import { buildMockAleoSigner } from "../signer";
import { startMockServer } from "../testSetup";

const mockServer = setupServer();

let sender: GeneratedAleoAccount;
let accountBridge: AccountBridge<AleoTransaction, AleoAccount>;

// Shared by the signer's record resolver and the prove handler so both see the same plaintexts.
let senderStore: RecordStore;

const RECORD_COUNT_BEFORE_UNSHIELD = 2;

const unshield: ScenarioTransaction<AleoTransaction, AleoAccount> = {
  name: `Unshield ${TRANSFER_AMOUNT_MICROCREDITS} microcredits from a private record back to the public balance`,
  mode: TRANSACTION_TYPE.CONVERT_PRIVATE_TO_PUBLIC,
  amount: new BigNumber(TRANSFER_AMOUNT_MICROCREDITS),
  // Filled in by prepareTransaction (auto record picking); the type requires the field.
  properties: { amountRecordCommitments: [], feeRecordCommitment: null },
  // No `recipient`: prepareTransaction pins it to account.freshAddress for CONVERT_ modes.
  expect: (previous, current) => {
    const newOperations = (current.operations as AleoOperation[]).filter(
      currentOp => !previous.operations.some(previousOp => previousOp.id === currentOp.id),
    );
    // An unshield is a self-transfer, so the bridge shows a public IN and a private OUT for it.
    expect(newOperations).toHaveLength(2);
    const publicSideOps = newOperations.filter(op => op.extra.transactionType === "public");
    const privateSideOps = newOperations.filter(op => op.extra.transactionType === "private");
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

    // Pins develop: the optimistic op had fee 0; aligning it is left to the fee-sponsoring epic.
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
};

export const scenarioTransferPrivateToPublic: Scenario<AleoTransaction, AleoAccount> = {
  name: "Ledger Live Aleo — private credit unshield",

  // Must not touch docker: spawnStack runs `compose down --volumes` and would kill the shared stack.
  setup: async () => {
    sender = await generateAleoAccount();

    // Record A covers the amount; record B is too small to be picked and must stay unspent.
    await mintPrivateRecord(sender.address, RECORD_A_MICROCREDITS);
    await mintPrivateRecord(sender.address, RECORD_B_MICROCREDITS);

    senderStore = createRecordStore({
      viewKey: sender.viewKey,
      address: sender.address,
    });
    await senderStore.refresh();

    const scanner = createFakeScanner();
    await scanner.setup();
    scanner.registerAccount({
      viewKey: sender.viewKey,
      address: sender.address,
    });

    startMockServer(mockServer);

    const expected: ExpectedTransfer = {
      recipient: sender.address,
      amount: TRANSFER_AMOUNT_MICROCREDITS,
      senderPrivateKey: sender.privateKey,
      privateRecordStore: senderStore,
    };
    mockServer.use(...buildAleoHandlers(expected), ...buildScannerHandlers(scanner));

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

  getTransactions: () => [unshield],

  beforeAll: account => {
    expect(account.currency.id).toBe(ALEO.id);
    expect(account.freshAddress).toBe(sender.address);
    expect(account.aleoResources?.transparentBalance).toStrictEqual(new BigNumber(0));
    expect(account.aleoResources?.privateBalance).toStrictEqual(
      new BigNumber(RECORD_A_MICROCREDITS + RECORD_B_MICROCREDITS),
    );
    expect(account.aleoResources?.unspentPrivateRecords).toHaveLength(RECORD_COUNT_BEFORE_UNSHIELD);
  },

  afterAll: async account => {
    expect(await getPublicBalance(sender.address)).toBe(BigInt(TRANSFER_AMOUNT_MICROCREDITS));
    expect(account.aleoResources?.transparentBalance).toStrictEqual(
      new BigNumber(TRANSFER_AMOUNT_MICROCREDITS),
    );
  },

  // The docker stack belongs to scenarii.test.ts.
  teardown: () => {
    mockServer.close();
  },
};
