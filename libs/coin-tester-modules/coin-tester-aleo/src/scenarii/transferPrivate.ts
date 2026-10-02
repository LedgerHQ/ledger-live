import BigNumber from "bignumber.js";
import { setupServer } from "msw/node";
import { firstValueFrom, reduce } from "rxjs";
import type { AccountBridge } from "@ledgerhq/types-live";
import type { Scenario, ScenarioTransaction } from "@ledgerhq/coin-tester/main";
import { setCryptoAssetsStore } from "@ledgerhq/ledger-wallet-framework/cryptoAssetsStore";
import type {
  AleoAccount,
  AleoOperation,
  Transaction as AleoTransaction,
} from "@ledgerhq/coin-aleo/types";
import { TRANSACTION_TYPE } from "@ledgerhq/coin-aleo/constants";
import {
  ALEO,
  PRIVATE_DEVNODE_FEE_RANGE,
  PUBLIC_DEVNODE_FEE_RANGE,
  RECORD_A_MICROCREDITS,
  RECORD_B_MICROCREDITS,
  TRANSFER_AMOUNT_MICROCREDITS,
  buildAleoCoinConfig,
  generateAleoAccount,
  getPublicBalance,
  makePrivateAleoAccount,
  type GeneratedAleoAccount,
} from "../fixtures";
import { getBridges } from "../helpers";
import { buildAleoHandlers, buildScannerHandlers } from "../msw/handlers";
import { buildTransaction, correctRecordVersion, type ExpectedTransfer } from "../msw/prove";
import { createRecordStore, type RecordStore } from "../msw/records";
import { createFakeScanner } from "../msw/scanner";
import { buildMockAleoSigner } from "../signer";
import type { ResolveRecord } from "../tlv/decodeRequest";
import { advanceBlocks } from "../stack";

const mockServer = setupServer();

// Generated fresh per test run, then funded from GENESIS_ACCOUNT in setup():
// sender is the account the harness tracks (so its sync exposes the two
// conversions and the OUT side of the private transfer), recipient is synced
// by hand in afterAll (so its sync exposes the private transfer's IN side).
let sender: GeneratedAleoAccount;
let recipient: GeneratedAleoAccount;
let accountBridge: AccountBridge<AleoTransaction, AleoAccount>;

// Backs both the mock signer's record resolver and the prove handler's own
// record lookup, so both sides read the same plaintexts for whichever
// commitments the real bridge picked. Refreshed in beforeSync, ahead of every
// sync and every signing that follows it.
let senderStore: RecordStore;

/** What the prove handler checks the next authorization against; mutated per transaction in beforeEach. */
let expected: ExpectedTransfer;

/** Index into getTransactions()'s array; advanced once per beforeEach call. */
let transactionIndex = 0;

/**
 * Sends `amount` straight to the devnode from GENESIS_ACCOUNT, bypassing the
 * bridge under test, and waits until the recipient's public balance reflects
 * it. Mirrors the probe pattern in scenarii.test.ts and transferPublic.ts.
 */
async function fundFromGenesis(recipientAddress: string, amount: number): Promise<void> {
  await buildTransaction({ recipient: recipientAddress, amount });

  for (let attempt = 0; attempt < 10; attempt++) {
    await advanceBlocks(1);
    if ((await getPublicBalance(recipientAddress)) >= BigInt(amount)) return;
  }

  throw new Error(`aleo coin-tester: funding transfer to ${recipientAddress} did not confirm`);
}

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
    // A conversion is a self-transfer across the public/private boundary, so the
    // bridge shows both of its sides: the public OUT it read off the indexer, and
    // a private IN it clones onto the same transaction once one of the account's
    // own records matches it.
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
    // The IN side is fee-exclusive: the record the account received holds the
    // converted amount and nothing else.
    expect(privateSide.value).toStrictEqual(new BigNumber(amount));

    // Conversions pay fee_public, priced by the devnode the same way sendPublic's
    // fee is in transferPublic.ts; only the order of magnitude is asserted here.
    expect(publicSide.fee.toNumber()).toBeGreaterThanOrEqual(PUBLIC_DEVNODE_FEE_RANGE.min);
    expect(publicSide.fee.toNumber()).toBeLessThanOrEqual(PUBLIC_DEVNODE_FEE_RANGE.max);
    // The OUT side is fee-inclusive, so it pins the amount exactly and the fee
    // only within the window the two assertions above bound it to.
    expect(publicSide.value).toStrictEqual(new BigNumber(amount).plus(publicSide.fee));

    // The converted amount stays with the account, as a private record, so the fee
    // is the only thing the total balance loses.
    expect(current.balance).toStrictEqual(previous.balance.minus(publicSide.fee));

    const previousUnspent = previous.aleoResources?.unspentPrivateRecords ?? [];
    const currentUnspent = current.aleoResources?.unspentPrivateRecords ?? [];
    expect(currentUnspent).toHaveLength(previousUnspent.length + 1);

    // The minted record must carry exactly the converted amount — this is what
    // keeps record A and record B distinguishable when sendPrivate spends them.
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
  "record B, reserved for the transfer's fee",
);

const sendPrivate: ScenarioTransaction<AleoTransaction, AleoAccount> = {
  name: `Send ${TRANSFER_AMOUNT_MICROCREDITS} microcredits privately to a fresh recipient`,
  mode: TRANSACTION_TYPE.TRANSFER_PRIVATE,
  amount: new BigNumber(TRANSFER_AMOUNT_MICROCREDITS),
  // recordPickingStrategy is "auto", so prepareTransaction fills these in
  // itself; the type still demands the field be present up front.
  properties: { amountRecordCommitments: [], feeRecordCommitment: null },
  get recipient() {
    return recipient.address;
  },
  // Assertions must be synchronous: the harness calls expect() synchronously and
  // retries it on assertion failure. Anything awaited goes to afterAll.
  expect: (previous, current) => {
    // The two conversions and this transfer can land in the same devnode block
    // window, so "newest operation" is not reliable — diffing against the
    // pre-broadcast sync is: whatever operation is new is this transaction's.
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

    // The chain-priced fee only gets an order-of-magnitude check here; the exact
    // 2308 the bridge bills is checked on the fee authorization in the prove handler.
    expect(latest.fee.toNumber()).toBeGreaterThanOrEqual(PRIVATE_DEVNODE_FEE_RANGE.min);
    expect(latest.fee.toNumber()).toBeLessThanOrEqual(PRIVATE_DEVNODE_FEE_RANGE.max);

    // An OUT operation's value is fee-inclusive, so it pins the amount exactly
    // and the fee only within the window the two assertions above bound it to.
    expect(latest.value).toStrictEqual(
      new BigNumber(TRANSFER_AMOUNT_MICROCREDITS).plus(latest.fee),
    );

    expect(previous.aleoResources?.privateBalance).not.toBeNull();
    // Both the amount and the fee were paid out of private records, so the whole
    // fee-inclusive value leaves the private balance.
    const previousPrivateBalance = previous.aleoResources!.privateBalance!;
    expect(current.aleoResources?.privateBalance).toStrictEqual(
      previousPrivateBalance.minus(latest.value),
    );
    // The total balance folds the private balance in, so it moves by the same
    // amount: nothing was paid out of the transparent side.
    expect(current.balance).toStrictEqual(previous.balance.minus(latest.value));

    // Records A and B (the two conversions' outputs) are the ones this transfer
    // spent as its amount and fee record; both must be gone from the unspent
    // set, replaced by exactly two change records.
    const previousCommitments = new Set(
      (previous.aleoResources?.unspentPrivateRecords ?? []).map(record => record.commitment),
    );
    const currentUnspent = current.aleoResources?.unspentPrivateRecords ?? [];
    expect(currentUnspent).toHaveLength(2);
    expect(currentUnspent.every(record => !previousCommitments.has(record.commitment))).toBe(true);

    expect(current.pendingOperations).toStrictEqual([]);
  },
};

export const scenarioTransferPrivate: Scenario<AleoTransaction, AleoAccount> = {
  name: "Ledger Live Aleo — private credit transfer",

  // Deliberately does not touch docker: spawnStack begins with
  // `compose down --volumes`, so calling it here would kill the running stack
  // mid-file, smoke-test ledger included.
  setup: async () => {
    transactionIndex = 0;

    setCryptoAssetsStore({
      findTokenById: async () => undefined,
      findTokenByAddressInCurrency: async () => undefined,
      getTokensSyncHash: async () => "",
    });

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

    mockServer.listen({
      onUnhandledRequest: request => {
        const { hostname } = new URL(request.url);
        // Localhost is the real SDK backend and devnode; everything else must be
        // handled here or fail loudly.
        if (["127.0.0.1", "localhost"].includes(hostname)) return;
        throw new Error(`Unhandled request: ${request.method} ${request.url}`);
      },
    });

    expected = {
      recipient: sender.address,
      amount: 0,
      senderPrivateKey: sender.privateKey,
    };
    mockServer.use(...buildAleoHandlers(expected), ...buildScannerHandlers(scanner));

    // Funds `sender` directly from the devnode, ahead of and outside the
    // bridge under test, with enough for both conversions plus headroom for
    // two devnode-priced fee_public payments (each conversion pays fee_public,
    // not fee_private).
    await fundFromGenesis(
      sender.address,
      RECORD_A_MICROCREDITS + RECORD_B_MICROCREDITS + PUBLIC_DEVNODE_FEE_RANGE.max * 2,
    );

    // The device decrypts a record input itself from the ciphertext it holds;
    // this mirrors that using senderStore, which beforeSync keeps refreshed
    // ahead of every sync and every signing that follows it.
    const resolveRecord: ResolveRecord = commitment => {
      const plaintext = senderStore.plaintextByCommitment(commitment);
      if (!plaintext) {
        throw new Error(
          `aleo coin-tester: no record plaintext for commitment ${commitment} in sender's own store`,
        );
      }
      // ExecutionRequest.sign derives its own commitment from this plaintext;
      // see correctRecordVersion's doc comment for why it needs correcting.
      return correctRecordVersion(plaintext);
    };
    const signer = buildMockAleoSigner(sender.privateKey, resolveRecord);
    const bridges = getBridges(signer, buildAleoCoinConfig());
    accountBridge = bridges.accountBridge;

    return {
      currencyBridge: bridges.currencyBridge,
      accountBridge,
      account: makePrivateAleoAccount(sender.address, sender.viewKey),
      // beforeSync seals a block on every retry, so 20 retries at 1 s converge
      // faster than the framework's 30 s default would.
      retryInterval: 1000,
      retryLimit: 20,
    };
  },

  // A devnode has no consensus, so beforeSync must seal the block itself on every
  // synchronization (retries included). senderStore is refreshed in step so its
  // resolver always sees whatever the previous transaction just minted.
  beforeSync: async () => {
    await advanceBlocks(1);
    await senderStore.refresh();
  },

  getTransactions: () => [convertRecordA, convertRecordB, sendPrivate],

  // Runs once per transaction, right before it is prepared and signed: aims
  // `expected` — and so the prove handler — at whichever transaction is next.
  // Indexed rather than inferred from `expected`'s current contents, so it
  // stays correct regardless of the fixture amounts in play.
  beforeEach: () => {
    if (transactionIndex === 0) {
      expected.recipient = sender.address;
      expected.amount = RECORD_A_MICROCREDITS;
    } else if (transactionIndex === 1) {
      expected.recipient = sender.address;
      expected.amount = RECORD_B_MICROCREDITS;
    } else {
      expected.recipient = recipient.address;
      expected.amount = TRANSFER_AMOUNT_MICROCREDITS;
      expected.privateRecordStore = senderStore;
    }
    transactionIndex++;
  },

  beforeAll: account => {
    expect(account.currency.id).toBe(ALEO.id);
    expect(account.freshAddress).toBe(sender.address);
    expect(account.aleoResources?.privateBalance).toStrictEqual(new BigNumber(0));
  },

  afterAll: async () => {
    // The chain never saw a single microcredit move to recipient's public
    // balance: only the private transfer touched it.
    expect(await getPublicBalance(recipient.address)).toBe(0n);

    // Ledger Live's own view of the IN side, synced through the real bridge —
    // not read off the fake scanner directly — the same way sendPublic's
    // afterAll proves the OUT side in transferPublic.ts.
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
    expect(latest.value).toStrictEqual(new BigNumber(TRANSFER_AMOUNT_MICROCREDITS));
    expect(recipientAccount.aleoResources?.privateBalance).toStrictEqual(
      new BigNumber(TRANSFER_AMOUNT_MICROCREDITS),
    );
  },

  // Closes only the mock server. The docker stack belongs to scenarii.test.ts,
  // and executeScenario calls teardown on both the success and the error path.
  teardown: () => {
    mockServer.close();
  },
};
