/**
 * `coin-zcash` was ported from the Zcash chain adapter that lives inside
 * `@ledgerhq/coin-bitcoin`. This runs the same inputs through both and asserts
 * they answer the same thing, so the port is checked against the reference
 * implementation rather than against a fixture of what we remember it doing.
 *
 * What it does *not* claim: this is not the behaviour of today's production
 * routing. The adapter's shielded path is disabled in every app (its
 * `isZcashShieldedEnabled` is a constant `false`, since routing now goes to
 * coin-zcash instead), so it has to be switched on here -- exactly as
 * coin-bitcoin's own tests do -- to have something to compare against.
 *
 * Only the hooks the adapter fully owns are compared. Where coin-zcash
 * deliberately replaced a fallback to the legacy Bitcoin logic, the difference is
 * asserted as such instead of being smoothed over.
 */

import { BigNumber } from "bignumber.js";
import type { Account } from "@ledgerhq/types-live";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { getChainAdapter } from "@ledgerhq/coin-bitcoin/chain-adapters/registry";
import { setZcashShieldedEnabled } from "@ledgerhq/coin-bitcoin/chain-adapters/zcash/constants";
import { getTransactionStatus } from "@ledgerhq/coin-zcash/bridge/getTransactionStatus";
import { estimateMaxSpendable } from "@ledgerhq/coin-zcash/bridge/estimateMaxSpendable";
import { prepareTransaction } from "@ledgerhq/coin-zcash/bridge/prepareTransaction";
import { computeZcashBalance } from "@ledgerhq/coin-zcash/logic/account/balance";

// Registers the adapter with the registry (see its index.ts).
import "@ledgerhq/coin-bitcoin/chain-adapters/zcash/index";

const currency = getCryptoCurrencyById("zcash");
const adapter = getChainAdapter("zcash");

const T_ADDRESS = "t1b1Rbw2shhJkP6MCnCyxCPuyFedHrwKty8";
const U_ADDRESS =
  "u1u2h4ce7e2cn3z4nzur95muq2dl4da9x8h8kdp2l80gm9nl9raj8zzpx79ycjnfvar4v5exea5pqr5y9qsnlp0cdunwf9yjjx5c4q7ar9";
const ZS_ADDRESS = "zs1z7rejlpsa98s2rrrfkwmaxu53e4ue0ulcrw0h4x5g8jl04tak0d3mm47vdtahatqrlkngh9slya";

const note = (amount: number, index: number) => ({
  amount: new BigNumber(amount),
  transfer_type: "incoming",
  memo: "",
  nullifier: index.toString(16).padStart(2, "0").repeat(32),
  rho: "ee".repeat(32),
  rseed: "ff".repeat(32),
  cmx: "11".repeat(32),
  position: String(index),
  recipient: "22".repeat(43),
  isSpent: false,
});

const utxo = (value: number, index: number) => ({
  hash: "aa".repeat(32),
  outputIndex: index,
  blockHeight: 3_425_800,
  address: T_ADDRESS,
  value: new BigNumber(value),
  rbf: false,
  isChange: false,
});

const sum = (notes: { amount: BigNumber }[]): BigNumber =>
  notes.reduce((total, n) => total.plus(n.amount), new BigNumber(0));

function account({
  utxos = [100_000, 25_000],
  notes = [40_000, 10_000],
  ironwoodNotes = [30_000, 20_000],
} = {}): Account {
  const shieldedNotes = notes.map(note);
  // Offset the indices so the two pools never share a nullifier or a position.
  const ironwood = ironwoodNotes.map((amount, i) => note(amount, i + 100));

  return {
    type: "Account",
    id: "js:2:zcash:xpub6D:",
    currency,
    bitcoinResources: { utxos: utxos.map(utxo) },
    privateInfo: {
      orchardBalance: sum(shieldedNotes),
      saplingBalance: new BigNumber(0),
      ironwoodBalance: sum(ironwood),
      syncState: "complete",
      progress: 100,
      estimatedTimeRemaining: { hours: 0, minutes: 0 },
      ufvk: "uview1key",
      birthday: "2022-05-31",
      lastSyncTimestamp: 1_700_000_000_000,
      lastProcessedBlock: 3_425_862,
      transactions: [
        {
          id: "932c99c7",
          hex: "00",
          blockHeight: 3_425_862,
          blockHash: "cc".repeat(32),
          timestamp: 1_700_000_000,
          fee: new BigNumber(15_000),
          decryptedData: {
            orchard_outputs: shieldedNotes,
            sapling_outputs: [],
            ironwood_outputs: ironwood,
          },
        },
      ],
    },
  } as unknown as Account;
}

/** `selectedNotes` is what the shielded flows validate against, so carry it. */
function transaction(overrides: Record<string, unknown> = {}) {
  return {
    family: "zcash",
    amount: new BigNumber(10_000),
    recipient: T_ADDRESS,
    transferType: "transparent",
    zcashFee: new BigNumber(15_000),
    feePerByte: null,
    networkInfo: undefined,
    useAllAmount: false,
    ...overrides,
  } as never;
}

/**
 * Errors are compared by `name`, not by wording: Ledger Live renders them
 * through their name and only falls back to the message, and each package
 * defines its own Zcash error classes -- coin-zcash with a readable default
 * message, coin-bitcoin with the class name. What has to agree is which error
 * lands under which key, which is what the caller acts on.
 */
const byName = (errors: Record<string, Error>): Record<string, string> =>
  Object.fromEntries(Object.entries(errors).map(([key, error]) => [key, error.name]));

const comparable = (status: {
  errors: Record<string, Error>;
  warnings: Record<string, Error>;
}) => ({ ...status, errors: byName(status.errors), warnings: byName(status.warnings) });

beforeAll(() => setZcashShieldedEnabled(true));
afterAll(() => setZcashShieldedEnabled(false));

describe("zcash balance, coin-bitcoin adapter vs coin-zcash", () => {
  it.each([
    ["a fully synced account", account()],
    ["an account with no shielded state", { ...account(), privateInfo: undefined } as Account],
    ["an account holding only Ironwood notes", account({ notes: [] })],
  ])("agrees on the total balance of %s", (_label, acc) => {
    const transparent = new BigNumber(125_000);

    expect(
      computeZcashBalance(transparent, (acc as never as { privateInfo: never }).privateInfo),
    ).toEqual(adapter.computeAccountBalance?.(acc as never, transparent));
  });
});

describe("zcash transaction status, coin-bitcoin adapter vs coin-zcash", () => {
  const cases: [string, Record<string, unknown>][] = [
    ["a transparent send", { transferType: "transparent", recipient: T_ADDRESS }],
    ["a shielding send", { transferType: "transparent-to-shielded", recipient: U_ADDRESS }],
    [
      "a shielded send",
      {
        transferType: "shielded",
        recipient: U_ADDRESS,
        selectedNotes: [note(40_000, 1)],
      },
    ],
    [
      "an unshielding send",
      {
        transferType: "shielded-to-transparent",
        recipient: T_ADDRESS,
        selectedNotes: [note(40_000, 1)],
      },
    ],
    ["an amount larger than the balance", { amount: new BigNumber(10_000_000) }],
    ["a zero amount", { amount: new BigNumber(0) }],
    ["a missing recipient", { recipient: "" }],
    ["a sapling recipient, which neither supports", { recipient: ZS_ADDRESS }],
    ["a recipient that is not an address at all", { recipient: "not-an-address" }],
    [
      "notes that do not cover the amount",
      {
        transferType: "shielded",
        recipient: U_ADDRESS,
        amount: new BigNumber(1_000_000),
        selectedNotes: [note(40_000, 1)],
      },
    ],
    [
      "no note selected for a shielded send",
      { transferType: "shielded", recipient: U_ADDRESS, selectedNotes: [] },
    ],
    // A shielded send spends the Ironwood pool, so it is bounded by the Ironwood
    // balance and must not draw on the deprecated Orchard balance.
    [
      "a shielded amount the ironwood pool alone cannot cover",
      {
        transferType: "shielded",
        recipient: U_ADDRESS,
        amount: new BigNumber(60_000),
        selectedNotes: [note(30_000, 100), note(20_000, 101)],
      },
    ],
  ];

  it.each(cases)("agrees on %s", async (_label, overrides) => {
    const acc = account();
    const tx = transaction(overrides);

    expect(comparable(await getTransactionStatus(acc as never, tx))).toEqual(
      comparable((await adapter.getTransactionStatus?.(acc, tx)) as never),
    );
  });

  it("agrees that a shielded send needs the scan to have run", async () => {
    const acc = { ...account(), privateInfo: undefined } as Account;
    const tx = transaction({ transferType: "shielded", recipient: U_ADDRESS });

    expect(comparable(await getTransactionStatus(acc as never, tx))).toEqual(
      comparable((await adapter.getTransactionStatus?.(acc, tx)) as never),
    );
  });
});

// What prepare resolves -- which notes are spent, the ZIP-317 fee, the change --
// is what the user signs and what the fee shown in the send modal comes from.
describe("zcash prepared transaction, coin-bitcoin adapter vs coin-zcash", () => {
  // Flows where both packages route to the same pool resolve to the identical
  // prepared transaction, transfer-type label included.
  it.each([
    ["a transparent send", { transferType: "transparent" }],
    ["a shielding send", { transferType: "transparent-to-shielded", recipient: U_ADDRESS }],
    // Neither pool can cover it, so each resets to an empty selection under its
    // own (unchanged) transfer type -- the insufficient-balance path agrees
    // whichever pool is consulted.
    [
      "more than the account holds",
      { transferType: "shielded", amount: new BigNumber(10_000_000) },
    ],
  ])("agrees on the fee, change and spent notes for %s", async (_label, overrides) => {
    const acc = account();
    const tx = transaction(overrides);

    expect(await prepareTransaction(acc as never, tx)).toEqual(
      await adapter.prepareTransaction?.(acc, tx),
    );
  });

  // coin-zcash routes every shielded-input send to the Ironwood pool: per
  // ZcashTransferType, "shielded" / "shielded-to-transparent" *denote* Ironwood
  // spends, whereas the adapter keeps the pool explicit and still reserves those
  // labels for the deprecated Orchard pool. The adapter's Ironwood transfer
  // types are the reference coin-zcash was ported from -- they resolve the same
  // notes, fee and change, and only the transfer-type label differs.
  const IRONWOOD_EQUIVALENT: Record<string, string> = {
    shielded: "ironwood",
    "shielded-to-transparent": "ironwood-to-transparent",
  };

  // Compare the resolved accounting (spent notes, fee, change, amount) rather
  // than the whole transaction, since the transfer-type label is deliberately
  // different on the two sides.
  const accounting = ({ transferType: _drop, ...rest }: Record<string, unknown>) => rest;

  it.each([
    ["a shielded send", { transferType: "shielded", recipient: U_ADDRESS }],
    ["an unshielding send", { transferType: "shielded-to-transparent" }],
    [
      "a send of everything",
      { transferType: "shielded", recipient: U_ADDRESS, useAllAmount: true },
    ],
  ])(
    "routes %s to the Ironwood pool, matching the adapter's Ironwood path",
    async (_label, overrides) => {
      const acc = account();
      const zcashTx = transaction(overrides);
      const adapterTx = transaction({
        ...overrides,
        transferType: IRONWOOD_EQUIVALENT[overrides.transferType as string],
      });

      const prepared = (await prepareTransaction(acc as never, zcashTx)) as Record<string, unknown>;
      const reference = (await adapter.prepareTransaction?.(acc, adapterTx)) as Record<
        string,
        unknown
      >;

      expect(accounting(prepared)).toEqual(accounting(reference));
    },
  );
});

describe("zcash max spendable, coin-bitcoin adapter vs coin-zcash", () => {
  it.each([
    ["a transparent send", { transferType: "transparent" }],
    ["a shielding send", { transferType: "transparent-to-shielded" }],
    ["a shielded send", { transferType: "shielded" }],
    ["an unshielding send", { transferType: "shielded-to-transparent" }],
  ])("agrees on the maximum spendable for %s", async (_label, overrides) => {
    const acc = account();
    const tx = transaction(overrides);

    expect(await estimateMaxSpendable({ account: acc as never, transaction: tx })).toEqual(
      await adapter.estimateMaxSpendable?.(acc, null, tx),
    );
  });

  it("answers for an account with no transaction, where the adapter defers to Bitcoin", async () => {
    const acc = account();

    // The adapter returns `undefined` here, handing the question to the legacy
    // Bitcoin estimator; coin-zcash owns the transparent path now and answers
    // with the ZIP-317 figure for spending the account's UTXOs.
    expect(adapter.estimateMaxSpendable?.(acc, null, null)).toBeUndefined();
    expect(
      (await estimateMaxSpendable({ account: acc as never, transaction: null as never })).gt(0),
    ).toBe(true);
  });
});
