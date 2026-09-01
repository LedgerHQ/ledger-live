import { BigNumber } from "bignumber.js";
import { Scenario, ScenarioTransaction } from "@ledgerhq/coin-tester/main";
import { createBridges } from "@ledgerhq/coin-zcash";
import type {
  Transaction as ZcashTransaction,
  ZcashAccount,
} from "@ledgerhq/coin-zcash/types/bridge";
import type { SignerContext } from "@ledgerhq/coin-zcash/types/signer";
import type { ZcashConfigInfo } from "@ledgerhq/coin-zcash";
import {
  setZainoGrpcUrl,
  ZCASH_SHIELDED_SPENDABILITY_DELAY_BLOCKS,
} from "@ledgerhq/coin-zcash/constants";
import {
  computeShieldedSpendFee,
  computeShieldingFee,
  computeZip317Fee,
} from "@ledgerhq/coin-zcash/logic/coin-selection";
import resolver from "@ledgerhq/coin-zcash/signer/getAddress";
import { orchardAddressFromUfvk } from "@ledgerhq/zcash-utils";
import { setZcashShieldedEnabled } from "@ledgerhq/live-common/bridge/zcashRouting";
import { getCryptoCurrencyById } from "@ledgerhq/ledger-wallet-framework/currencies";
import { LiveConfig } from "@ledgerhq/live-config/LiveConfig";
import { setEnv } from "@ledgerhq/live-env";
import { SYNC_TYPE_SHIELDED, SYNC_TYPE_TRANSPARENT } from "@ledgerhq/types-live";
import {
  assertCommonTxProperties,
  assertIronwoodBalanceDelta,
  assertTransparentBalanceDelta,
  ironwoodBalance,
  transparentBalance,
} from "../assert";
import { EXPLORER_ORIGIN, startIndexer, stopIndexer } from "../indexer";
import { makeAccount } from "../fixtures";
import { generateBlocks, generateBlocksToAddress } from "../helpers";
import { randomMainnetBurnAddress, randomRegtestBurnAddress } from "../regtestAddress";
import { killRegtestNode, spawnRegtestNode, ZAINO_GRPC_URL } from "../regtestNode";
import { buildSigner } from "../signer";
import { findNewUtxo } from "../utils";

type ZcashCoinConfig = { info: ZcashConfigInfo };
type ZcashScenarioTransaction = ScenarioTransaction<ZcashTransaction, ZcashAccount>;

// zcash-utils is asked for "mainnet" throughout (UFVK/address derivation, PCZT
// build, signing) to match the mainnet-prefixed addresses coin-zcash's own
// classifier requires -- see zcash_regtest.ts and signer.ts for the full
// rationale. Zaino is likewise addressed as "mainnet" for the same reason.
const ZCASH_UTILS_NETWORK = "mainnet";

// Deliberately small, fixed absolute amounts (not a fraction of the coinbase
// reward, which is unknown at scenario-construction time and depends on the
// regtest funding-stream schedule): comfortably below any plausible block
// subsidy, so a fixed value is safe without asserting a specific fact about
// the chain's reward schedule.
const T_TO_T_AMOUNT = new BigNumber(50_000);
const Z_TO_T_AMOUNT = new BigNumber(25_000);

// Number of Ironwood notes accumulated before the final sweep, per Teddy's
// request: build up to NOTE_COUNT_TARGET notes, then send everything back in
// one transaction, exercising `selectNotes`' largest-first multi-note
// selection (untested elsewhere in this file -- every other scenario here
// only ever has exactly 1 spendable note).
const NOTE_COUNT_TARGET = 10;
// Well above DUST_THRESHOLD (5_000, see coin-selection.ts) so the change note
// each split leaves behind is never absorbed into the fee, and small enough
// that NOTE_COUNT_TARGET - 1 splits never come close to exhausting the
// account's remaining balance (a full coinbase reward, minus a few tens of
// thousands already spent by the scenarios above).
const NOTE_SPLIT_AMOUNT = new BigNumber(20_000);

// How many blocks to confirm each transaction with (mined right after its own
// broadcast -- see mockIndexer below): comfortably past
// ZCASH_SHIELDED_SPENDABILITY_DELAY_BLOCKS (12) and enough real time for the
// shielded (zaino-backed) scan to catch up before the next transaction reads
// the account's balance. Mined to the burn address, never to the account --
// these are regular, non-coinbase transaction outputs by the time this runs,
// so nothing here needs maturity anyway.
const BLOCKS_BETWEEN_TRANSACTIONS = ZCASH_SHIELDED_SPENDABILITY_DELAY_BLOCKS + 3;

// Zcash's unconditional transparent coinbase maturity rule: a coinbase output
// cannot be spent until 100 blocks after the block that created it (separate
// from -- and not relaxed by -- regtest's own
// `should_allow_unshielded_coinbase_spends`, which only lifts the *shielding*
// requirement, empirically confirmed against the real zebrad binary: a spend
// of a height-1 coinbase at height 6 rejects with "immature transparent
// coinbase spend ... spends are invalid before Height(101), which is 100
// blocks after it was created at Height(1)").
//
// `@ledgerhq/coin-zcash`'s transparent send spends every UTXO the account
// holds unconditionally (no amount-driven coin selection -- see
// `resolveTransparentUtxos`), so the account must never hold more than the
// one coinbase UTXO it starts with: mining any further blocks to the
// account's own address (regtest's mining.miner_address pays every block it
// mines to whichever address it names) would keep recreating a fresh,
// immature UTXO forever. So setup() mines exactly one funding block to the
// account, then confirms it past maturity -- and every block mined after
// that, including BLOCKS_BETWEEN_TRANSACTIONS, goes to a throwaway burn
// address instead (see randomRegtestBurnAddress).
const COINBASE_MATURITY_BLOCKS = 100;

let shieldedRecipientAddress = "";
let transparentRecipientAddress = "";
let externalTransparentAddress = "";
let burnAddress = "";

const makeScenarioTransactions = (): ZcashScenarioTransaction[] => {
  const scenarioTransparentToTransparent: ZcashScenarioTransaction = {
    name: "Send ZEC transparent to transparent (t→t)",
    family: "zcash",
    transferType: "transparent",
    sender: "public",
    recipientType: "public",
    amount: T_TO_T_AMOUNT,
    // Deliberately a genuinely external address, not transparentRecipientAddress
    // (the account's own -- reused by the z→t flow below, where de-shielding
    // into the same account's transparent balance is the point). Sending to
    // self here would make coin-zcash's own operation mapping
    // (`mapTxToOperations`'s OUT/IN split) record the recipient output as a
    // second, non-change "IN" credit alongside the "OUT" spend -- since it is
    // not one of the account's own internal change-scope addresses -- breaking
    // both assertCommonTxProperties's "exactly one new operation" assumption
    // and the fee/balance-delta math below, which assumes nothing comes back.
    recipient: externalTransparentAddress,
    expect: (previousAccount, currentAccount) => {
      const operation = assertCommonTxProperties(previousAccount, currentAccount);
      const inputCount = previousAccount.bitcoinResources.utxos.length;
      const gotChange = findNewUtxo(previousAccount, currentAccount) !== undefined;
      const expectedFee = computeZip317Fee(0, 0, inputCount, gotChange ? 2 : 1);

      expect(operation.fee.toFixed()).toBe(expectedFee.toFixed());
      expect(operation.value.toFixed()).toBe(T_TO_T_AMOUNT.plus(expectedFee).toFixed());
      assertTransparentBalanceDelta(
        previousAccount,
        currentAccount,
        T_TO_T_AMOUNT.plus(expectedFee).negated(),
      );
    },
  };

  const scenarioTransparentToShielded: ZcashScenarioTransaction = {
    name: "Shield ZEC transparent to shielded (t→z)",
    family: "zcash",
    transferType: "transparent-to-shielded",
    sender: "public",
    recipientType: "private",
    useAllAmount: true,
    recipient: shieldedRecipientAddress,
    expect: (previousAccount, currentAccount) => {
      const [latestOperation] = currentAccount.operations;
      expect(latestOperation.type).toBe("OUT");

      const inputCount = previousAccount.bitcoinResources.utxos.length;
      const expectedFee = computeShieldingFee(inputCount, 1);
      expect(latestOperation.fee.toFixed()).toBe(expectedFee.toFixed());

      const shieldedAmount = transparentBalance(previousAccount).minus(expectedFee);
      assertTransparentBalanceDelta(
        previousAccount,
        currentAccount,
        transparentBalance(previousAccount).negated(),
      );
      assertIronwoodBalanceDelta(previousAccount, currentAccount, shieldedAmount);
    },
  };

  const scenarioShieldedToTransparent: ZcashScenarioTransaction = {
    name: "De-shield ZEC shielded to transparent (z→t)",
    family: "zcash",
    transferType: "shielded-to-transparent",
    sender: "private",
    recipientType: "public",
    amount: Z_TO_T_AMOUNT,
    recipient: transparentRecipientAddress,
    expect: (previousAccount, currentAccount) => {
      // A single Ironwood note (from the shielding leg above) fully covers this
      // small amount, so exactly 1 spend is consumed and change comes back as a
      // new Ironwood note -- i.e. hasChange is always true here.
      const expectedFee = computeShieldedSpendFee(1, true, "shielded-to-transparent");
      const [latestOperation] = currentAccount.operations;
      // "IN", not "OUT": mapTxToOperations (coin-zcash's own transparent-leg
      // bookkeeping, sync.ts) only records "OUT" when the transaction is
      // *funded by a transparent input* (`fundedByAccount`) -- a de-shielding
      // send has none (it spends Ironwood notes), so from the transparent
      // pool's own perspective this legitimately looks like an inflow arriving
      // from nowhere, exactly like any other incoming transfer. The shielded
      // spend side is accounted for separately, via ironwoodBalance below --
      // there is no discrete "OUT" operation for it (empirically confirmed).
      expect(latestOperation.type).toBe("IN");
      expect(latestOperation.fee.toFixed()).toBe(expectedFee.toFixed());

      assertTransparentBalanceDelta(previousAccount, currentAccount, Z_TO_T_AMOUNT);
      assertIronwoodBalanceDelta(
        previousAccount,
        currentAccount,
        Z_TO_T_AMOUNT.plus(expectedFee).negated(),
      );
    },
  };

  const scenarioShieldedToShielded: ZcashScenarioTransaction = {
    name: "Send ZEC shielded to shielded (z→z)",
    family: "zcash",
    transferType: "shielded",
    sender: "private",
    recipientType: "private",
    useAllAmount: true,
    recipient: shieldedRecipientAddress,
    expect: (previousAccount, currentAccount) => {
      // useAllAmount over the single remaining (change) Ironwood note: 1 spend,
      // no change -- see computeShieldedSpendFee's "shielded" branch.
      const expectedFee = computeShieldedSpendFee(1, false, "shielded");
      const [latestOperation] = currentAccount.operations;
      expect(latestOperation.type).toBe("SHIELDED_TX_IRONWOOD_IN");
      expect(latestOperation.fee.toFixed()).toBe(expectedFee.toFixed());

      // Self-transfer within the same pool: the note is fully re-spent (fee
      // paid out of it), so the pool's net balance only drops by the fee.
      assertIronwoodBalanceDelta(previousAccount, currentAccount, expectedFee.negated());
    },
  };

  // Splits one Ironwood note into two (a payment note back to our own
  // external address, plus a change note at our internal address): net +1
  // note per call, since exactly 1 note is consumed and 2 are created.
  // `selectNotes` always picks the single largest note to cover
  // NOTE_SPLIT_AMOUNT alone (it dwarfs every note in play here), so this
  // never spends more than 1 note per round -- the note *count* grows, but
  // each individual split stays a 1-spend transaction.
  const makeNoteSplitScenario = (round: number): ZcashScenarioTransaction => ({
    name: `Split shielded note into two (${round}/${NOTE_COUNT_TARGET - 1})`,
    family: "zcash",
    transferType: "shielded",
    sender: "private",
    recipientType: "private",
    amount: NOTE_SPLIT_AMOUNT,
    recipient: shieldedRecipientAddress,
    expect: (previousAccount, currentAccount) => {
      const expectedFee = computeShieldedSpendFee(1, true, "shielded");
      const [latestOperation] = currentAccount.operations;
      // "SHIELDED_TX_IRONWOOD_IN", same reasoning as scenarioShieldedToShielded
      // above: the change note lands on our *internal* address and carries
      // transfer_type "internal", invisible to getTxType's net-delta sum: only
      // the payment note (external address, transfer_type "incoming") counts,
      // and it nets positive.
      expect(latestOperation.type).toBe("SHIELDED_TX_IRONWOOD_IN");
      expect(latestOperation.fee.toFixed()).toBe(expectedFee.toFixed());

      // Payment + change both stay in the account's own Ironwood pool -- only
      // the fee actually leaves it.
      assertIronwoodBalanceDelta(previousAccount, currentAccount, expectedFee.negated());
    },
  });

  const noteSplitScenarios: ZcashScenarioTransaction[] = Array.from(
    { length: NOTE_COUNT_TARGET - 1 },
    (_, i) => makeNoteSplitScenario(i + 1),
  );

  const scenarioNoteConsolidationSweep: ZcashScenarioTransaction = {
    name: `De-shield all ${NOTE_COUNT_TARGET} accumulated notes in a single sweep (z→t)`,
    family: "zcash",
    transferType: "shielded-to-transparent",
    sender: "private",
    recipientType: "public",
    useAllAmount: true,
    recipient: transparentRecipientAddress,
    expect: (previousAccount, currentAccount) => {
      const previousIronwoodBalance = ironwoodBalance(previousAccount);
      // useAllAmount forces selectNotes to spend every one of the
      // NOTE_COUNT_TARGET accumulated notes (the splits' payment notes plus
      // the final remaining change note) in one transaction -- the multi-note
      // selection path this scenario exists to exercise.
      const expectedFee = computeShieldedSpendFee(
        NOTE_COUNT_TARGET,
        false,
        "shielded-to-transparent",
      );
      const [latestOperation] = currentAccount.operations;
      // "IN", same reasoning as scenarioShieldedToTransparent above: no
      // transparent input funds this transaction, so mapTxToOperations
      // records the transparent-leg credit as an inflow regardless of how
      // many Ironwood notes fund it.
      expect(latestOperation.type).toBe("IN");
      expect(latestOperation.fee.toFixed()).toBe(expectedFee.toFixed());

      assertTransparentBalanceDelta(
        previousAccount,
        currentAccount,
        previousIronwoodBalance.minus(expectedFee),
      );
      assertIronwoodBalanceDelta(
        previousAccount,
        currentAccount,
        previousIronwoodBalance.negated(),
      );
    },
  };

  return [
    scenarioTransparentToTransparent,
    scenarioTransparentToShielded,
    scenarioShieldedToTransparent,
    scenarioShieldedToShielded,
    ...noteSplitScenarios,
    scenarioNoteConsolidationSweep,
  ];
};

export const scenarioZcash: Scenario<ZcashTransaction, ZcashAccount> = {
  name: "Ledger Live Basic Zcash Transactions",
  setup: async () => {
    const { signer, ufvk, xpub, accountIndex } = buildSigner();
    const signerContext: SignerContext = (_deviceId, fn) => fn(signer);

    setEnv("EXPLORER", EXPLORER_ORIGIN);
    setZainoGrpcUrl(ZAINO_GRPC_URL, ZCASH_UTILS_NETWORK);
    setZcashShieldedEnabled(true);

    const coinConfig: ZcashCoinConfig = { info: { status: { type: "active" } } };
    LiveConfig.setConfig({
      config_currency_zcash_regtest: {
        type: "object",
        default: { status: { type: "active" } },
      },
    });

    const { accountBridge, currencyBridge } = createBridges(signerContext, () => coinConfig);
    const ZCASH_REGTEST = getCryptoCurrencyById("zcash_regtest");

    const getAddress = resolver(signerContext);
    const { address, publicKey } = await getAddress("", {
      path: `44'/${ZCASH_REGTEST.coinType}'/${accountIndex}'/0/0`,
      currency: ZCASH_REGTEST,
      derivationMode: "",
    });

    const account = makeAccount(xpub, publicKey, address, ZCASH_REGTEST, "", ufvk);

    shieldedRecipientAddress = orchardAddressFromUfvk(ufvk);
    transparentRecipientAddress = address;
    externalTransparentAddress = randomMainnetBurnAddress();

    await spawnRegtestNode(address);
    burnAddress = randomRegtestBurnAddress();
    // Exactly one coinbase block to the account (see COINBASE_MATURITY_BLOCKS's
    // comment for why not more), then confirm it past the maturity window
    // with blocks mined to the burn address instead, plus a small margin.
    await generateBlocks(1);
    await generateBlocksToAddress(COINBASE_MATURITY_BLOCKS + 5, burnAddress);

    // Must start before setup() returns: executeScenario (coin-tester/main.ts)
    // runs the account's *first* sync right after setup(), and only calls the
    // `beforeAll` hook after that first sync completes -- so registering the
    // indexer there would leave the first sync racing an MSW server that
    // isn't listening yet (empirically confirmed: ECONNREFUSED 127.0.0.1:9877).
    startIndexer();

    return {
      // `@ledgerhq/coin-tester`'s executeScenario calls accountBridge.sync
      // with just `{ paginationConfig: {} }` -- coin-tester's own SyncConfig
      // is chain-agnostic, and has no notion of coin-zcash's own `syncType`
      // bitmask extension (`SYNC_TYPE_SHIELDED`, in `@ledgerhq/types-live`).
      // Without it, `buildExtraSyncObservable` (bridge/sync.ts) returns
      // `undefined` unconditionally and the Ironwood/Orchard scan never runs
      // at all -- ironwoodBalance stays exactly 0 forever, empirically
      // confirmed (not a slow-catch-up timing issue: 20 retries over 100s
      // made no difference). Forcing both bits on every sync call this
      // package's own scenario ever makes is the fix, entirely inside this
      // package -- coin-tester's shared core and coin-zcash's own source stay
      // untouched.
      accountBridge: {
        ...accountBridge,
        sync: (syncAccount, syncConfig) =>
          accountBridge.sync(syncAccount, {
            ...syncConfig,
            syncType: (syncConfig.syncType ?? 0) | SYNC_TYPE_TRANSPARENT | SYNC_TYPE_SHIELDED,
          }),
      },
      currencyBridge,
      account,
      retryLimit: 20,
      retryInterval: 5_000,
    };
  },
  getTransactions: () => makeScenarioTransactions(),
  // executeScenario (coin-tester/main.ts) calls this right after broadcast,
  // before the sync-and-assert retry loop starts -- confirming here (rather
  // than in afterEach, which only runs once that loop already succeeds) is
  // what makes the just-broadcast transaction visible at all: zebra's
  // address-indexed RPCs (getaddresstxids/getrawtransaction, backing this
  // package's indexer.ts) only see mined transactions, never the mempool, so
  // without this the retry loop exhausts all 20 attempts waiting on a
  // transaction that can never confirm on its own (empirically confirmed).
  mockIndexer: async () => {
    await generateBlocksToAddress(BLOCKS_BETWEEN_TRANSACTIONS, burnAddress);
  },
  afterAll: async account => {
    expect(account.operations.length).toBeGreaterThanOrEqual(4 + NOTE_COUNT_TARGET);
    stopIndexer();
  },
  teardown: async () => {
    stopIndexer();
    await killRegtestNode();
  },
};
