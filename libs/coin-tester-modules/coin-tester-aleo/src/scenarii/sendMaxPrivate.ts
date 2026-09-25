import BigNumber from "bignumber.js";
import { setupServer } from "msw/node";
import { firstValueFrom, reduce } from "rxjs";
import type { AccountBridge } from "@ledgerhq/types-live";
import type { Scenario, ScenarioTransaction } from "@ledgerhq/coin-tester/main";
import { setCryptoAssetsStore } from "@ledgerhq/ledger-wallet-framework/cryptoAssetsStore";
import type {
  AleoAccount,
  AleoOperation,
  AleoUnspentRecord,
  Transaction as AleoTransaction,
} from "@ledgerhq/coin-aleo/types";
import {
  MAX_PRIVATE_RECORDS_PER_TRANSACTION,
  TRANSACTION_TYPE,
} from "@ledgerhq/coin-aleo/constants";
import {
  ALEO,
  BATCHER_PROGRAM_ID,
  GENESIS_ACCOUNT,
  PRIVATE_DEVNODE_FEE_RANGE,
  SEND_MAX_PRIVATE_SMALLEST_RECORD_MICROCREDITS,
  TRANSFER_PRIVATE_BASE_FEE,
  buildAleoCoinConfig,
  generateAleoAccount,
  getPublicBalance,
  makePrivateAleoAccount,
  type GeneratedAleoAccount,
} from "../fixtures";
import { deployBatcherProgram } from "../bootstrapToken";
import { getBridges } from "../helpers";
import { mintPrivateRecords } from "../mint";
import { buildAleoHandlers, buildScannerHandlers } from "../msw/handlers";
import { correctRecordVersion, type ExpectedTransfer } from "../msw/prove";
import { createRecordStore, type RecordStore } from "../msw/records";
import { createFakeScanner } from "../msw/scanner";
import { buildMockAleoSigner } from "../signer";
import type { ResolveRecord } from "../tlv/decodeRequest";
import { advanceBlocks } from "../stack";
import type { AleoWasm } from "../wasm";
import { loadAleoWasm } from "../wasm";

/** 14 amount records plus the one left over for the fee, per the design's record cap. */
const RECORD_COUNT = MAX_PRIVATE_RECORDS_PER_TRANSACTION + 1;

const mockServer = setupServer();

// Generated fresh per test run, then given 15 private records in setup():
// owner is the account the harness tracks (so its sync exposes the OUT side),
// recipient is synced by hand in afterAll (so its sync exposes the IN side).
let owner: GeneratedAleoAccount;
let recipient: GeneratedAleoAccount;
let accountBridge: AccountBridge<AleoTransaction, AleoAccount>;

// Backs both the mock signer's record resolver and the prove handler's own
// record lookup, so both sides read the same plaintexts for whichever
// commitments the real bridge picked among the 14 spendable amount records.
let senderStore: RecordStore;

/** The record `mintPrivateRecords` sizes last and smallest; must pay the fee, never the amount. */
let smallestRecordCommitment: string;

/** Sum of the 14 records above the smallest — what a send-max is expected to move. */
let expectedAmount: number;

/** Sum of all 15 minted records — the private balance an initial sync reports. */
let totalMintedAmount: number;

/**
 * A join's merged output record has never existed on chain — senderStore
 * never scans it, because no block ever carries it — so any structurally
 * valid record satisfies signing here: `buildTransaction` rebuilds the real
 * transaction from the 14 original records alone and never touches a join's
 * output, and `request.verify()` checks only signature self-consistency, not
 * agreement with chain state (`docs/wasm-record-commitment.md`).
 */
function fabricateJoinOutputRecord(wasm: AleoWasm, address: string): string {
  const nonce = wasm.Group.random().toString();
  return `{ owner: ${address}.private, microcredits: 1u64.private, _nonce: ${nonce}.public, _version: 0u8.public }`;
}

const sendMaxPrivate: ScenarioTransaction<AleoTransaction, AleoAccount> = {
  name: "Send max private microcredits from a 15-record sender to a fresh recipient",
  mode: TRANSACTION_TYPE.TRANSFER_PRIVATE,
  useAllAmount: true,
  // recordPickingStrategy is "auto", so prepareTransaction fills these in
  // itself; the type still demands the field be present up front.
  properties: { amountRecordCommitments: [], feeRecordCommitment: null },
  get recipient() {
    return recipient.address;
  },
  // Assertions must be synchronous: the harness calls expect() synchronously
  // and retries it on assertion failure. Anything awaited goes to afterAll.
  expect: (previous, current) => {
    const newOperations = (current.operations as AleoOperation[]).filter(
      currentOp => !previous.operations.some(previousOp => previousOp.id === currentOp.id),
    );
    expect(newOperations).toHaveLength(1);
    const [latest] = newOperations;

    expect(latest.type).toBe("OUT");
    expect(latest.hasFailed).toBe(false);
    expect(latest.extra.transactionType).toBe("private");
    expect(latest.senders).toStrictEqual([owner.address]);
    expect(latest.recipients).toStrictEqual([recipient.address]);

    // The chain-priced fee only gets an order-of-magnitude check here; the
    // exact base fee the bridge bills is checked on the fee authorization in
    // the prove handler.
    expect(latest.fee.toNumber()).toBeGreaterThanOrEqual(PRIVATE_DEVNODE_FEE_RANGE.min);
    expect(latest.fee.toNumber()).toBeLessThanOrEqual(PRIVATE_DEVNODE_FEE_RANGE.max);
    expect(latest.fee.toNumber()).toBeLessThanOrEqual(TRANSFER_PRIVATE_BASE_FEE);

    // An operation's value is fee-exclusive, so it pins the send-max amount
    // exactly: the sum of the 14 records above the smallest one.
    expect(latest.value).toStrictEqual(new BigNumber(expectedAmount));

    expect(previous.aleoResources?.privateBalance).not.toBeNull();
    // Both the amount and the fee were paid out of private records, so the
    // private balance loses the two together.
    const previousPrivateBalance = previous.aleoResources!.privateBalance!;
    expect(current.aleoResources?.privateBalance).toStrictEqual(
      previousPrivateBalance.minus(latest.value).minus(latest.fee),
    );
    // The total balance folds the private balance in, so it moves by the same
    // amount: nothing was paid out of the transparent side.
    expect(current.balance).toStrictEqual(previous.balance.minus(latest.value).minus(latest.fee));

    // All 15 minted records are gone: the 14 above the smallest paid the
    // amount, and the smallest — spent but absent from the amount sum
    // above — is the one record that could only have paid the fee.
    const previousUnspent = (previous.aleoResources?.unspentPrivateRecords ??
      []) as AleoUnspentRecord[];
    expect(previousUnspent).toHaveLength(RECORD_COUNT);
    expect(previousUnspent.some(record => record.commitment === smallestRecordCommitment)).toBe(
      true,
    );

    const currentUnspent = (current.aleoResources?.unspentPrivateRecords ??
      []) as AleoUnspentRecord[];
    const previousCommitments = new Set(previousUnspent.map(record => record.commitment));
    expect(currentUnspent.every(record => !previousCommitments.has(record.commitment))).toBe(true);

    expect(current.pendingOperations).toStrictEqual([]);
  },
};

export const scenarioSendMaxPrivate: Scenario<AleoTransaction, AleoAccount> = {
  name: "Ledger Live Aleo — private credit send-max, batched over 14 records",

  // Deliberately does not touch docker: spawnStack begins with
  // `compose down --volumes`, so calling it here would kill the running stack
  // mid-file, smoke-test ledger included.
  setup: async () => {
    setCryptoAssetsStore({
      findTokenById: async () => undefined,
      findTokenByAddressInCurrency: async () => undefined,
      getTokensSyncHash: async () => "",
    });

    [owner, recipient] = await Promise.all([generateAleoAccount(), generateAleoAccount()]);

    // Signed by GENESIS_ACCOUNT, the only pre-funded account: deploying costs a
    // fee, and owner holds nothing public until the mint below gives it private
    // records.
    await deployBatcherProgram(GENESIS_ACCOUNT);

    const amounts = await mintPrivateRecords({
      recipient: owner.address,
      count: RECORD_COUNT,
      smallest: SEND_MAX_PRIVATE_SMALLEST_RECORD_MICROCREDITS,
    });
    expectedAmount = amounts.slice(0, -1).reduce((sum, amount) => sum + amount, 0);
    totalMintedAmount = amounts.reduce((sum, amount) => sum + amount, 0);

    senderStore = createRecordStore({ viewKey: owner.viewKey, address: owner.address });
    await senderStore.refresh();
    // `RecordStore.list()` walks a `Map`, so it comes back in insertion order —
    // the same order the blocks were mined in, which is mint order. The last
    // one minted is the smallest, by mintPrivateRecords's own construction.
    const minted = senderStore.list();
    if (minted.length !== RECORD_COUNT) {
      throw new Error(
        `test setup: senderStore scanned ${minted.length} records, expected ${RECORD_COUNT}`,
      );
    }
    smallestRecordCommitment = minted[minted.length - 1].commitment;

    const scanner = createFakeScanner();
    await scanner.setup();
    scanner.registerAccount({ viewKey: owner.viewKey, address: owner.address });
    scanner.registerAccount({ viewKey: recipient.viewKey, address: recipient.address });

    mockServer.listen({
      onUnhandledRequest: request => {
        const { hostname } = new URL(request.url);
        // Localhost is the real SDK backend and devnode; everything else must be
        // handled here or fail loudly.
        if (["127.0.0.1", "localhost"].includes(hostname)) return;
        throw new Error(`Unhandled request: ${request.method} ${request.url}`);
      },
    });

    const expected: ExpectedTransfer = {
      recipient: recipient.address,
      amount: expectedAmount,
      senderPrivateKey: owner.privateKey,
      privateRecordStore: senderStore,
      programId: BATCHER_PROGRAM_ID,
    };
    mockServer.use(...buildAleoHandlers(expected), ...buildScannerHandlers(scanner));

    const wasm = await loadAleoWasm();
    // The device decrypts a real record input itself from its ciphertext; this
    // mirrors that for the 14 amount records and the fee record, and fabricates
    // whatever a join's merged output needs (see fabricateJoinOutputRecord).
    const resolveRecord: ResolveRecord = commitment => {
      const plaintext = senderStore.plaintextByCommitment(commitment);
      if (plaintext) {
        // ExecutionRequest.sign derives its own commitment from this plaintext;
        // see correctRecordVersion's doc comment for why it needs correcting.
        return correctRecordVersion(plaintext);
      }
      return fabricateJoinOutputRecord(wasm, owner.address);
    };
    const signer = buildMockAleoSigner(owner.privateKey, resolveRecord);
    const bridges = getBridges(signer, buildAleoCoinConfig());
    accountBridge = bridges.accountBridge;

    return {
      currencyBridge: bridges.currencyBridge,
      accountBridge,
      account: makePrivateAleoAccount(owner.address, owner.viewKey),
      // beforeSync seals a block on every retry, so 20 retries at 1 s converge
      // faster than the framework's 30 s default would.
      retryInterval: 1000,
      retryLimit: 20,
    };
  },

  // A devnode has no consensus, so beforeSync must seal the block itself on every
  // synchronization (retries included). senderStore is refreshed in step so its
  // resolver always sees the 15 minted records ahead of signing.
  beforeSync: async () => {
    await advanceBlocks(1);
    await senderStore.refresh();
  },

  getTransactions: () => [sendMaxPrivate],

  beforeAll: account => {
    expect(account.currency.id).toBe(ALEO.id);
    expect(account.freshAddress).toBe(owner.address);
    // All 15 records were minted before the account's first sync, unlike
    // transferPrivate.ts's fresh account: the send-max amount depends on this.
    expect(account.aleoResources?.privateBalance).toStrictEqual(new BigNumber(totalMintedAmount));
    expect(account.aleoResources?.unspentPrivateRecords).toHaveLength(RECORD_COUNT);
  },

  afterAll: async () => {
    // The chain never saw a single microcredit move to recipient's public
    // balance: only the private transfer touched it.
    expect(await getPublicBalance(recipient.address)).toBe(0n);

    // Ledger Live's own view of the IN side, synced through the real bridge —
    // not read off the fake scanner directly — the same way sendMaxPublic's
    // afterAll proves the OUT side in sendMaxPublic.ts.
    const recipientAccount = await firstValueFrom(
      accountBridge
        .sync(makePrivateAleoAccount(recipient.address, recipient.viewKey), {
          paginationConfig: {},
        })
        .pipe(
          reduce((acc, f) => f(acc), makePrivateAleoAccount(recipient.address, recipient.viewKey)),
        ),
    );

    const privateOperations = (recipientAccount.operations as AleoOperation[]).filter(
      op => op.extra.transactionType === "private",
    );
    expect(privateOperations).toHaveLength(1);
    const [latest] = privateOperations;
    expect(latest.type).toBe("IN");
    expect(latest.hasFailed).toBe(false);
    expect(latest.recipients).toStrictEqual([recipient.address]);
    // Fee-exclusive, unlike the sender's OUT: the recipient paid no fee.
    expect(latest.value).toStrictEqual(new BigNumber(expectedAmount));
    expect(recipientAccount.aleoResources?.privateBalance).toStrictEqual(
      new BigNumber(expectedAmount),
    );
  },

  // Closes only the mock server. The docker stack belongs to scenarii.test.ts,
  // and executeScenario calls teardown on both the success and the error path.
  teardown: () => {
    mockServer.close();
  },
};
