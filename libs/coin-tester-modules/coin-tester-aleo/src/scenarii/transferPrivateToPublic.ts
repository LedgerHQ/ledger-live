import BigNumber from "bignumber.js";
import { setupServer } from "msw/node";
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
import { mintPrivateRecord } from "../mint";
import { buildAleoHandlers, buildScannerHandlers } from "../msw/handlers";
import { correctRecordVersion, type ExpectedTransfer } from "../msw/prove";
import { createRecordStore, type RecordStore } from "../msw/records";
import { createFakeScanner } from "../msw/scanner";
import { buildMockAleoSigner } from "../signer";
import type { ResolveRecord } from "../tlv/decodeRequest";
import { advanceBlocks } from "../stack";

const mockServer = setupServer();

/**
 * The one account the scenario needs. `transfer_private_to_public` is a
 * self-transfer — `prepareTransaction` overwrites the recipient with
 * `account.freshAddress` for every CONVERT_ mode — so the credits land back on
 * the same account, on its public side.
 */
let sender: GeneratedAleoAccount;
let accountBridge: AccountBridge<AleoTransaction, AleoAccount>;

// Backs both the mock signer's record resolver and the prove handler's own
// record lookup, so both sides read the same plaintexts for whichever
// commitments the real bridge picked. Refreshed in beforeSync, ahead of every
// sync and every signing that follows it.
let senderStore: RecordStore;

/** Records the sender holds before the unshield: the amount record and the fee record. */
const RECORD_COUNT_BEFORE_UNSHIELD = 2;

const unshield: ScenarioTransaction<AleoTransaction, AleoAccount> = {
  name: `Unshield ${TRANSFER_AMOUNT_MICROCREDITS} microcredits from a private record back to the public balance`,
  mode: TRANSACTION_TYPE.CONVERT_PRIVATE_TO_PUBLIC,
  amount: new BigNumber(TRANSFER_AMOUNT_MICROCREDITS),
  // recordPickingStrategy is "auto", so prepareTransaction fills these in
  // itself; the type still demands the field be present up front.
  properties: { amountRecordCommitments: [], feeRecordCommitment: null },
  // No `recipient`: prepareTransaction pins it to account.freshAddress for a
  // self-transfer, so naming one here would only be overwritten.

  // Assertions must be synchronous: the harness calls expect() synchronously and
  // retries it on assertion failure. Anything awaited goes to afterAll.
  expect: (previous, current) => {
    const newOperations = (current.operations as AleoOperation[]).filter(
      currentOp => !previous.operations.some(previousOp => previousOp.id === currentOp.id),
    );
    // An unshield is a self-transfer across the public/private boundary, so the
    // bridge shows both of its sides: the public IN it read off the indexer, and
    // a private OUT it clones onto the same transaction once the change record
    // of the spent private record matches it.
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
    // The IN side is fee-exclusive: the public balance received the converted
    // amount and nothing else.
    expect(publicSide.value).toStrictEqual(new BigNumber(TRANSFER_AMOUNT_MICROCREDITS));

    expect(privateSide.type).toBe("OUT");
    expect(privateSide.hasFailed).toBe(false);
    expect(privateSide.hash).toBe(publicSide.hash);
    expect(privateSide.senders).toStrictEqual([sender.address]);
    expect(privateSide.recipients).toStrictEqual([sender.address]);

    // An unshield pays fee_private out of a record, priced by the devnode the
    // same way sendPrivate's fee is in transferPrivate.ts; only the order of
    // magnitude is asserted here, since the exact base fee the bridge bills is
    // checked on the fee authorization in the prove handler.
    expect(privateSide.fee.toNumber()).toBeGreaterThanOrEqual(PRIVATE_DEVNODE_FEE_RANGE.min);
    expect(privateSide.fee.toNumber()).toBeLessThanOrEqual(PRIVATE_DEVNODE_FEE_RANGE.max);
    expect(publicSide.fee).toStrictEqual(privateSide.fee);
    // The OUT side is fee-exclusive too, so both sides of the conversion carry
    // the same value: the converted amount.
    expect(privateSide.value).toStrictEqual(new BigNumber(TRANSFER_AMOUNT_MICROCREDITS));

    // The public side of the account is where the unshielded credits land. The
    // sender was funded privately only, so before this transaction its
    // transparent balance was zero and afterwards it is exactly the amount.
    const previousTransparentBalance =
      previous.aleoResources?.transparentBalance ?? new BigNumber(0);
    expect(current.aleoResources?.transparentBalance).toStrictEqual(
      previousTransparentBalance.plus(TRANSFER_AMOUNT_MICROCREDITS),
    );

    // Both the amount and the fee left private records, so the private balance
    // loses the two together.
    expect(previous.aleoResources?.privateBalance).not.toBeNull();
    const previousPrivateBalance = previous.aleoResources!.privateBalance!;
    expect(current.aleoResources?.privateBalance).toStrictEqual(
      previousPrivateBalance.minus(privateSide.value).minus(privateSide.fee),
    );

    // The converted amount stays with the account, as public credits, so the fee
    // is the only thing the total balance loses.
    expect(current.balance).toStrictEqual(previous.balance.minus(privateSide.fee));

    // The amount record and the fee record are both spent, replaced by exactly
    // two change records — one from the `sub` inside transfer_private_to_public,
    // one from fee_private.
    const previousUnspent = previous.aleoResources?.unspentPrivateRecords ?? [];
    expect(previousUnspent).toHaveLength(RECORD_COUNT_BEFORE_UNSHIELD);
    const previousCommitments = new Set(previousUnspent.map(record => record.commitment));
    const currentUnspent = current.aleoResources?.unspentPrivateRecords ?? [];
    expect(currentUnspent).toHaveLength(2);
    expect(currentUnspent.every(record => !previousCommitments.has(record.commitment))).toBe(true);

    expect(current.pendingOperations).toStrictEqual([]);
  },
};

export const scenarioTransferPrivateToPublic: Scenario<AleoTransaction, AleoAccount> = {
  name: "Ledger Live Aleo — private credit unshield",

  // Deliberately does not touch docker: spawnStack begins with
  // `compose down --volumes`, so calling it here would kill the running stack
  // mid-file, smoke-test ledger included.
  setup: async () => {
    setCryptoAssetsStore({
      findTokenById: async () => undefined,
      findTokenByAddressInCurrency: async () => undefined,
      getTokensSyncHash: async () => "",
    });

    sender = await generateAleoAccount();

    // Minted straight on the devnode, outside the bridge under test, so the
    // unshield is the first thing that ever touches this account through the
    // bridge. Record A covers the amount, record B is the smaller one
    // findBestRecordForFee picks for fee_private; the sizes are the same pair
    // transferPrivate.ts converts into.
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
      recipient: sender.address,
      amount: TRANSFER_AMOUNT_MICROCREDITS,
      senderPrivateKey: sender.privateKey,
      privateRecordStore: senderStore,
    };
    mockServer.use(...buildAleoHandlers(expected), ...buildScannerHandlers(scanner));

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
  // resolver always sees whatever the account currently holds.
  beforeSync: async () => {
    await advanceBlocks(1);
    await senderStore.refresh();
  },

  getTransactions: () => [unshield],

  beforeAll: account => {
    expect(account.currency.id).toBe(ALEO.id);
    expect(account.freshAddress).toBe(sender.address);
    // Funded privately only, so the whole balance sits in records and the
    // transparent side is empty — which is what makes the post-unshield public
    // balance readable as exactly the converted amount.
    expect(account.aleoResources?.transparentBalance).toStrictEqual(new BigNumber(0));
    expect(account.aleoResources?.privateBalance).toStrictEqual(
      new BigNumber(RECORD_A_MICROCREDITS + RECORD_B_MICROCREDITS),
    );
    expect(account.aleoResources?.unspentPrivateRecords).toHaveLength(RECORD_COUNT_BEFORE_UNSHIELD);
  },

  afterAll: async account => {
    // Chain-level ground truth for the side the unshield credited, read off the
    // devnode rather than through the bridge: the account held no public
    // credits at all before this scenario, so its public balance is now exactly
    // what was unshielded.
    expect(await getPublicBalance(sender.address)).toBe(BigInt(TRANSFER_AMOUNT_MICROCREDITS));
    expect(account.aleoResources?.transparentBalance).toStrictEqual(
      new BigNumber(TRANSFER_AMOUNT_MICROCREDITS),
    );
  },

  // Closes only the mock server. The docker stack belongs to scenarii.test.ts,
  // and executeScenario calls teardown on both the success and the error path.
  teardown: () => {
    mockServer.close();
  },
};
