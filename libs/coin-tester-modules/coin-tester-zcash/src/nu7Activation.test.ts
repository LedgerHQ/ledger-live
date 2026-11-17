// Test seam (must be registered before any other module transitively loads
// @ledgerhq/coin-zcash/network/ZCash). See zcashClientTestSeam.ts.
jest.mock("@ledgerhq/coin-zcash/network/ZCash", () => require("./zcashClientTestSeam"));

import console from "console";
import BigNumber from "bignumber.js";
import type {
  Transaction as ZcashTransaction,
  ZcashAccount,
} from "@ledgerhq/coin-zcash/types/bridge";
import { LEGACY_MARGINAL_FEE, computeZip317Fee } from "@ledgerhq/coin-zcash/logic/coin-selection";
import { getChainTip, parsePczt } from "@ledgerhq/zcash-utils";
import type { SignOperationEvent } from "@ledgerhq/types-live";
import { assertTransparentBalanceDelta } from "./assert";
import { createBridgeSetup } from "./bridgeSetup";
import {
  generateBlocks,
  generateBlocksToAddress,
  getBlockCount,
  getRawTransaction,
  waitForZainoTip,
} from "./helpers";
import { startIndexer, stopIndexer } from "./indexer";
import { randomMainnetBurnAddress, randomRegtestBurnAddress } from "./regtestAddress";
import { killRegtestNode, spawnRegtestNode, ZAINO_GRPC_URL } from "./regtestNode";
import {
  clearCapturedPcztHex,
  getCapturedPcztHex,
  setRegtestActivationHeights,
} from "./zcashClientTestSeam";
import { findNewUtxo } from "./utils";

global.console = console;
// Same budget as scenarii.test.ts: a cold zaino build alone takes ~25 minutes.
jest.setTimeout(50 * 60 * 1000);

// Low enough that the whole test stays a few hundred blocks long, high enough
// to leave room for the coinbase to mature (100 blocks) before the crossing.
const NU7_ACTIVATION_HEIGHT = 140;

// Consensus branch ids, from zcash_protocol's `BranchId`.
const NU6_3_BRANCH_ID = 0x37a5165b;
const NU7_BRANCH_ID = 0x77190ad9;

// Default transaction expiry delta, from zcash_primitives' builder: 40 blocks
// before NU7 (BLOSSOM_DEFAULT_TX_EXPIRY_DELTA), and 3 x 40 from NU7 on, which
// keeps the ~50 minutes of validity at the 25-second block spacing (ZIP 218,
// "Default expiry delta").
const DEFAULT_EXPIRY_DELTA = 40;
const NU7_DEFAULT_EXPIRY_DELTA = 120;

// Blocks of validity, counted from the target height, that @ledgerhq/zcash-utils
// requires a crafted transaction to keep (MIN_VALIDITY_BLOCKS: 3 for zcashd's
// expiring-soon rule + 5 of margin for the time spent signing).
const MIN_VALIDITY_BLOCKS = 8;

const COINBASE_MATURITY_BLOCKS = 100;
const SEND_AMOUNT = new BigNumber(50_000);
const ACCOUNT_INDEX = 0;

type ZebraTransactionWithExpiry = Awaited<ReturnType<typeof getRawTransaction>> & {
  expiryheight?: number;
};

function capturedGlobal() {
  return parsePczt(getCapturedPcztHex(ACCOUNT_INDEX)).global;
}

describe("NU7 activation on regtest", () => {
  let setup: Awaited<ReturnType<typeof createBridgeSetup>>;
  let accountBridge: typeof setup.accountBridge;
  let account: ZcashAccount;
  let burnAddress: string;
  let externalRecipient: string;

  async function mine(blocks: number): Promise<void> {
    await generateBlocksToAddress(blocks, burnAddress);
    await waitForZainoTip();
  }

  async function mineUntilTip(tip: number): Promise<void> {
    const current = await getBlockCount();
    expect(current).toBeLessThanOrEqual(tip);
    if (current < tip) await mine(tip - current);
  }

  async function syncAccount(): Promise<ZcashAccount> {
    const observable = accountBridge.sync(account, { paginationConfig: {} });
    const previous = account;
    account = await new Promise<ZcashAccount>((resolve, reject) => {
      let current = previous;
      observable.subscribe({
        next: update => {
          current = update(current);
        },
        error: reject,
        complete: () => resolve(current),
      });
    });
    return account;
  }

  // The transparent send flow end to end, up to and including the signature.
  async function prepareAndSign() {
    const transaction: ZcashTransaction = {
      ...accountBridge.createTransaction(account),
      family: "zcash",
      transferType: "transparent",
      sender: "public",
      recipientType: "public",
      amount: SEND_AMOUNT,
      recipient: externalRecipient,
    };
    const prepared = await accountBridge.prepareTransaction(account, transaction);
    const status = await accountBridge.getTransactionStatus(account, prepared);
    expect(Object.keys(status.errors)).toEqual([]);

    const events = accountBridge.signOperation({ account, transaction: prepared, deviceId: "" });
    const signedOperation = await new Promise<SignOperationEvent & { type: "signed" }>(
      (resolve, reject) => {
        events.subscribe({
          next: event => {
            if (event.type === "signed") resolve(event);
          },
          error: reject,
          complete: () => reject(new Error("signOperation completed without a signature")),
        });
      },
    ).then(event => event.signedOperation);
    return signedOperation;
  }

  beforeAll(async () => {
    setup = await createBridgeSetup();
    accountBridge = setup.accountBridge;
    account = setup.account;
    burnAddress = randomRegtestBurnAddress();
    externalRecipient = randomMainnetBurnAddress();

    // The builder must see the schedule the node enforces, or it never caps.
    setRegtestActivationHeights({ nu7: NU7_ACTIVATION_HEIGHT });
    await spawnRegtestNode(setup.address, { nu7ActivationHeight: NU7_ACTIVATION_HEIGHT });

    // One coinbase to the account, confirmed past maturity by blocks mined to a
    // burn address, so the account only ever holds the one spendable UTXO (see
    // scenarii/zcash.ts).
    await generateBlocks(1);
    await generateBlocksToAddress(COINBASE_MATURITY_BLOCKS + 5, burnAddress);
    startIndexer();
    await waitForZainoTip();
    await syncAccount();
  });

  afterAll(async () => {
    stopIndexer();
    setRegtestActivationHeights(undefined);
    await killRegtestNode();
  });

  it("caps the expiry one block below NU7 and signs for the previous branch id", async () => {
    const target = (await getBlockCount()) + 1;
    // Without the cap the expiry would land past the activation height.
    expect(target + DEFAULT_EXPIRY_DELTA).toBeGreaterThanOrEqual(NU7_ACTIVATION_HEIGHT);

    const signedOperation = await prepareAndSign();

    const global = capturedGlobal();
    expect(global.consensusBranchId).toBe(NU6_3_BRANCH_ID);
    expect(global.expiryHeight).toBe(NU7_ACTIVATION_HEIGHT - 1);

    const previous = account;
    const hash = await accountBridge
      .broadcast({ signedOperation, account })
      .then(operation => operation.hash);
    await mine(1);

    const mined = (await getRawTransaction(hash)) as ZebraTransactionWithExpiry;
    expect(mined.height).toBeDefined();
    expect(mined.expiryheight).toBe(NU7_ACTIVATION_HEIGHT - 1);
    expect(mined.expiryheight).toBeLessThan(NU7_ACTIVATION_HEIGHT);

    await syncAccount();
    const fee = computeZip317Fee(
      0,
      0,
      previous.bitcoinResources.utxos.length,
      findNewUtxo(previous, account) !== undefined ? 2 : 1,
      LEGACY_MARGINAL_FEE,
    );
    assertTransparentBalanceDelta(previous, account, SEND_AMOUNT.plus(fee).negated());
  });

  it("still signs when the capped expiry leaves exactly the minimum validity", async () => {
    // Capped expiry (NU7 - 1) == target + MIN_VALIDITY_BLOCKS.
    const lastAcceptedTarget = NU7_ACTIVATION_HEIGHT - 1 - MIN_VALIDITY_BLOCKS;
    await mineUntilTip(lastAcceptedTarget - 1);
    await syncAccount();

    // Craft and sign only: nothing is broadcast, the UTXOs stay unspent.
    await prepareAndSign();
    expect(capturedGlobal().expiryHeight).toBe(NU7_ACTIVATION_HEIGHT - 1);
  });

  it("refuses to craft once the capped expiry leaves less than the minimum validity", async () => {
    await mine(1);
    await syncAccount();
    expect((await getBlockCount()) + 1 + MIN_VALIDITY_BLOCKS).toBe(NU7_ACTIVATION_HEIGHT);

    clearCapturedPcztHex(ACCOUNT_INDEX);
    await expect(prepareAndSign()).rejects.toThrow(/expiry too close to activation/);
    // The refusal happens before any PCZT exists, so nothing was handed to the signer.
    expect(() => getCapturedPcztHex(ACCOUNT_INDEX)).toThrow(/No PCZT hex captured/);
  });

  it("keeps zaino following zebra across the activation height", async () => {
    await mineUntilTip(NU7_ACTIVATION_HEIGHT + 5);

    const zebraTip = await getBlockCount();
    expect(zebraTip).toBeGreaterThan(NU7_ACTIVATION_HEIGHT);
    expect(await getChainTip(ZAINO_GRPC_URL)).toBe(zebraTip);
  });

  it("signs for NU7 with the 120-block default expiry delta after activation", async () => {
    await syncAccount();
    const previous = account;
    const target = (await getBlockCount()) + 1;
    expect(target).toBeGreaterThan(NU7_ACTIVATION_HEIGHT);

    const signedOperation = await prepareAndSign();

    const global = capturedGlobal();
    expect(global.consensusBranchId).toBe(NU7_BRANCH_ID);
    expect(global.expiryHeight).toBe(target + NU7_DEFAULT_EXPIRY_DELTA);

    const hash = await accountBridge
      .broadcast({ signedOperation, account })
      .then(operation => operation.hash);
    await mine(1);

    const mined = (await getRawTransaction(hash)) as ZebraTransactionWithExpiry;
    expect(mined.height).toBeGreaterThanOrEqual(NU7_ACTIVATION_HEIGHT);
    expect(mined.expiryheight).toBe(target + NU7_DEFAULT_EXPIRY_DELTA);

    await syncAccount();
    const fee = computeZip317Fee(
      0,
      0,
      previous.bitcoinResources.utxos.length,
      findNewUtxo(previous, account) !== undefined ? 2 : 1,
      LEGACY_MARGINAL_FEE,
    );
    assertTransparentBalanceDelta(previous, account, SEND_AMOUNT.plus(fee).negated());

    // The whole test stays a short chain: no retention, peer or reorg window is reached.
    expect(await getBlockCount()).toBeLessThan(200);
  });
});

["exit", "SIGINT", "SIGQUIT", "SIGTERM", "SIGUSR1", "SIGUSR2", "uncaughtException"].forEach(e =>
  process.on(e, () => {
    killRegtestNode().catch(() => {});
  }),
);
