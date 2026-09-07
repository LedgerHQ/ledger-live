import { BigNumber } from "bignumber.js";
import { NotEnoughBalance } from "@ledgerhq/ledger-wallet-framework/errors";
import { getTransactionStatus } from "./getTransactionStatus";
import { prepareTransaction } from "./prepareTransaction";
import {
  computeAmountError,
  computeRecipientError,
  isTransparentInputTransfer,
  isTransparentOutputDust,
  resolveTransparentUtxos,
} from "./statusHelpers";
import { TRANSPARENT_OUTPUT_DUST_THRESHOLD, ZIP317_MINIMUM_FEE } from "../logic/coin-selection";
import { ZcashAmountBelowDustThreshold, ZcashSendTooLarge } from "../types/errors";
import type { BitcoinOutput, Transaction, ZcashAccount, ZcashTransferType } from "../types/bridge";
import type { SpendableNote } from "../network/types";
import {
  ZCASH_MAX_IRONWOOD_ACTIONS,
  ZCASH_MAX_TRANSPARENT_INPUTS,
  ZCASH_SHIELDED_SPENDABILITY_DELAY_BLOCKS,
} from "../constants";

const T_ADDRESS = "t1b1Rbw2shhJkP6MCnCyxCPuyFedHrwKty8";
const U_ADDRESS =
  "u1u2h4ce7e2cn3z4nzur95muq2dl4da9x8h8kdp2l80gm9nl9raj8zzpx79ycjnfvar4v5exea5pqr5y9qsnlp0cdunwf9yjjx5c4q7ar9";
const ZS_ADDRESS = "zs1z7rejlpsa98s2rrrfkwmaxu53e4ue0ulcrw0h4x5g8jl04tak0d3mm47vdtahatqrlkngh9slya";

const REFERENCE_HEIGHT = 3_450_000;
const MATURE_BLOCK = REFERENCE_HEIGHT - ZCASH_SHIELDED_SPENDABILITY_DELAY_BLOCKS;
const FRESH_BLOCK = REFERENCE_HEIGHT - 3; // still maturing

const note = (amount: number, index = 1): SpendableNote =>
  ({
    amount: new BigNumber(amount),
    nullifier: index.toString(16).padStart(2, "0").repeat(32),
    rho: "ee".repeat(32),
    rseed: "ff".repeat(32),
    cmx: "11".repeat(32),
    position: String(index),
    recipient: "22".repeat(43),
    isSpent: false,
  }) as unknown as SpendableNote;

/** A raw pool note, as scanned into `ShieldedTransaction.decryptedData.ironwood_outputs`. */
const poolNote = (amount: number, index: number) => ({
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

const utxo = (value: number, outputIndex = 0): BitcoinOutput => ({
  hash: "aa".repeat(32),
  outputIndex,
  blockHeight: 3_425_800,
  address: T_ADDRESS,
  value: new BigNumber(value),
  rbf: false,
  isChange: false,
});

function account({
  utxos = [100_000, 25_000],
  orchardBalance = 50_000,
  ironwoodNotes = [50_000],
  freshIronwoodNotes = [],
  synced = true,
  shieldedKey = true,
  lastProcessedBlock = REFERENCE_HEIGHT,
}: {
  utxos?: number[];
  orchardBalance?: number;
  /** Mature Ironwood notes -- scanned deep enough below `lastProcessedBlock`. */
  ironwoodNotes?: number[];
  /** Ironwood notes scanned only a few blocks ago -- still maturing. */
  freshIronwoodNotes?: number[];
  synced?: boolean;
  /** Whether the UFVK has been exported from the device, i.e. the account can
   *  take part in the shielded pools at all. */
  shieldedKey?: boolean;
  lastProcessedBlock?: number | null;
} = {}): ZcashAccount {
  const ironwoodBalance = [...ironwoodNotes, ...freshIronwoodNotes].reduce((s, v) => s + v, 0);
  const transactions = [
    ...(ironwoodNotes.length
      ? [
          {
            id: "mature-tx",
            hex: "00",
            blockHeight: MATURE_BLOCK,
            blockHash: "cc".repeat(32),
            timestamp: 1_700_000_000,
            fee: new BigNumber(0),
            decryptedData: {
              orchard_outputs: [],
              sapling_outputs: [],
              ironwood_outputs: ironwoodNotes.map((amount, i) => poolNote(amount, i)),
            },
          },
        ]
      : []),
    ...(freshIronwoodNotes.length
      ? [
          {
            id: "fresh-tx",
            hex: "00",
            blockHeight: FRESH_BLOCK,
            blockHash: "dd".repeat(32),
            timestamp: 1_700_000_100,
            fee: new BigNumber(0),
            decryptedData: {
              orchard_outputs: [],
              sapling_outputs: [],
              ironwood_outputs: freshIronwoodNotes.map((amount, i) => poolNote(amount, i + 100)),
            },
          },
        ]
      : []),
  ];

  return {
    type: "Account",
    id: "js:2:zcash:xpub6D:",
    currency: { id: "zcash", name: "Zcash" },
    bitcoinResources: { utxos: utxos.map((value, i) => utxo(value, i)) },
    privateInfo: synced
      ? {
          orchardBalance: new BigNumber(orchardBalance),
          ironwoodBalance: new BigNumber(ironwoodBalance),
          saplingBalance: new BigNumber(0),
          ufvk: shieldedKey ? "uview1test" : null,
          lastProcessedBlock,
          transactions,
        }
      : undefined,
  } as unknown as ZcashAccount;
}

function transaction(overrides: Partial<Transaction> = {}): Transaction {
  return {
    family: "zcash",
    transferType: "transparent",
    amount: new BigNumber(10_000),
    recipient: T_ADDRESS,
    useAllAmount: false,
    ...overrides,
  } as Transaction;
}

const errorNames = (errors: Record<string, Error>): Record<string, string> =>
  Object.fromEntries(Object.entries(errors).map(([key, error]) => [key, error.name]));

describe("isTransparentInputTransfer", () => {
  // A shielded send spends notes, so it must never pull the account's UTXOs in.
  it.each([
    ["transparent", true],
    ["transparent-to-shielded", true],
    ["shielded", false],
    ["shielded-to-transparent", false],
  ] as [ZcashTransferType, boolean][])("answers %s with %s", (transferType, expected) => {
    expect(isTransparentInputTransfer(transferType)).toBe(expected);
  });
});

describe("resolveTransparentUtxos", () => {
  it("returns the account's synced set for a transparent-input flow", () => {
    const acc = account({ utxos: [7_000, 3_000] });

    expect(resolveTransparentUtxos(acc, transaction()).map(u => u.value.toString())).toEqual([
      "7000",
      "3000",
    ]);
  });

  it("prefers the caller's selection over the synced set", () => {
    const acc = account({ utxos: [7_000] });
    const selectedUtxos = [utxo(1_234, 4)];

    expect(resolveTransparentUtxos(acc, transaction({ selectedUtxos }))).toEqual(selectedUtxos);
  });

  it("returns nothing for a flow that spends notes, even with UTXOs available", () => {
    const acc = account({ utxos: [7_000] });

    expect(resolveTransparentUtxos(acc, transaction({ transferType: "shielded" }))).toEqual([]);
    expect(
      resolveTransparentUtxos(
        acc,
        transaction({ transferType: "shielded", selectedUtxos: [utxo(1)] }),
      ),
    ).toEqual([]);
  });

  it("tolerates an account that has never been synced", () => {
    const acc = { ...account(), bitcoinResources: undefined } as unknown as ZcashAccount;

    expect(resolveTransparentUtxos(acc, transaction())).toEqual([]);
  });

  // An explicit empty selection means "spend none of them", which is not the
  // same as not having chosen -- it must not fall back to the whole account.
  it("takes an empty selection at its word", () => {
    const acc = account({ utxos: [7_000] });

    expect(resolveTransparentUtxos(acc, transaction({ selectedUtxos: [] }))).toEqual([]);
  });
});

describe("computeRecipientError", () => {
  it.each([
    ["", "RecipientRequired"],
    ["not-an-address", "InvalidAddress"],
    [ZS_ADDRESS, "ZcashSaplingRecipientNotSupported"],
  ])("rejects %s with %s", (recipient, expected) => {
    expect(computeRecipientError(recipient, "Zcash", true)?.name).toBe(expected);
  });

  it.each([T_ADDRESS, U_ADDRESS])("accepts %s", recipient => {
    expect(computeRecipientError(recipient, "Zcash", true)).toBe(undefined);
  });

  // Paying an Orchard receiver needs a shielded bundle, which the builder can
  // only assemble from the account's UFVK.
  it("rejects a shielded recipient when the account has no UFVK", () => {
    expect(computeRecipientError(U_ADDRESS, "Zcash", false)?.name).toBe("ZcashShieldedKeyMissing");
  });

  it("still accepts a transparent recipient when the account has no UFVK", () => {
    expect(computeRecipientError(T_ADDRESS, "Zcash", false)).toBe(undefined);
  });

  // The address is malformed whether or not a viewing key exists; reporting the
  // missing key instead would send the user off to the export flow for nothing.
  it.each([
    ["not-an-address", "InvalidAddress"],
    [ZS_ADDRESS, "ZcashSaplingRecipientNotSupported"],
  ])("keeps reporting %s as %s without a UFVK", (recipient, expected) => {
    expect(computeRecipientError(recipient, "Zcash", false)?.name).toBe(expected);
  });
});

describe("isTransparentOutputDust", () => {
  it("is false for a non-positive amount -- that is caught by the positive-amount check instead", () => {
    expect(isTransparentOutputDust(new BigNumber(0))).toBe(false);
    expect(isTransparentOutputDust(new BigNumber(-1))).toBe(false);
  });

  // The bound is exclusive: exactly the threshold is a valid, non-dust value.
  it.each([
    ["one zatoshi below the threshold", TRANSPARENT_OUTPUT_DUST_THRESHOLD - 1, true],
    ["exactly the threshold", TRANSPARENT_OUTPUT_DUST_THRESHOLD, false],
    ["one zatoshi above the threshold", TRANSPARENT_OUTPUT_DUST_THRESHOLD + 1, false],
  ] as [string, number, boolean][])("is %s -> dust: %s", (_label, amount, expected) => {
    expect(isTransparentOutputDust(new BigNumber(amount))).toBe(expected);
  });
});

describe("computeAmountError", () => {
  const pool = new BigNumber(50_000);

  it("accepts an amount the selected notes cover", () => {
    const tx = transaction({ transferType: "shielded", selectedNotes: [note(40_000)] });

    expect(computeAmountError(tx, new BigNumber(20_000), pool)).toBe(undefined);
  });

  // Both bounds are inclusive: spending a pool, or a note, down to the last
  // zatoshi is a valid send.
  it.each([
    ["the pool is spent to the last zatoshi", [note(50_000)], 50_000],
    ["the selected note is spent exactly", [note(20_000)], 20_000],
  ] as [string, SpendableNote[], number][])("accepts a send where %s", (_label, notes, spent) => {
    const tx = transaction({ transferType: "shielded", selectedNotes: notes });

    expect(computeAmountError(tx, new BigNumber(spent), pool)).toBe(undefined);
  });

  it("rejects a non-positive amount unless everything is being sent", () => {
    const zero = { transferType: "shielded" as const, selectedNotes: [note(40_000)] };

    expect(
      computeAmountError(transaction({ ...zero, amount: new BigNumber(0) }), pool, pool),
    ).toEqual(new Error("Amount must be positive"));
    expect(
      computeAmountError(
        transaction({ ...zero, amount: new BigNumber(0), useAllAmount: true }),
        new BigNumber(20_000),
        pool,
      ),
    ).toBe(undefined);
  });

  it.each([
    ["no note is selected", undefined, new BigNumber(20_000), "Insufficient shielded balance"],
    ["the selection is empty", [], new BigNumber(20_000), "Insufficient shielded balance"],
    [
      "the pool cannot cover amount and fee",
      [note(40_000)],
      new BigNumber(60_000),
      "Insufficient shielded balance",
    ],
    [
      "the selected notes fall short of amount and fee",
      [note(10_000)],
      new BigNumber(20_000),
      "Selected notes do not cover amount + fee",
    ],
  ] as [string, SpendableNote[] | undefined, BigNumber, string][])(
    "rejects when %s",
    (_label, selectedNotes, totalSpent, message) => {
      const tx = transaction({
        transferType: "shielded",
        ...(selectedNotes && { selectedNotes }),
      });

      expect(computeAmountError(tx, totalSpent, pool)).toEqual(new Error(message));
    },
  );
});

describe("getTransactionStatus, transparent-input flows", () => {
  it("prices a send with the transaction's fee and reports what it spends", async () => {
    const status = await getTransactionStatus(
      account(),
      transaction({ amount: new BigNumber(30_000), zcashFee: new BigNumber(15_000) }),
    );

    expect(status).toEqual({
      errors: {},
      warnings: {},
      estimatedFees: new BigNumber(15_000),
      amount: new BigNumber(30_000),
      totalSpent: new BigNumber(45_000),
      recipientIsReadOnly: false,
    });
  });

  it("falls back to the ZIP-317 minimum when no fee has been resolved yet", async () => {
    const status = await getTransactionStatus(account(), transaction());

    expect(status.estimatedFees).toEqual(new BigNumber(ZIP317_MINIMUM_FEE));
    expect(status.totalSpent).toEqual(new BigNumber(10_000 + ZIP317_MINIMUM_FEE));
  });

  it("validates against the transparent UTXOs alone, not the shielded pools", async () => {
    const acc = account({ utxos: [20_000], orchardBalance: 10_000_000 });
    const status = await getTransactionStatus(
      acc,
      transaction({ amount: new BigNumber(50_000), zcashFee: new BigNumber(10_000) }),
    );

    expect(errorNames(status.errors)).toEqual({ amount: "NotEnoughBalance" });
  });

  // The bound is inclusive: emptying the account is a valid send, one zatoshi
  // more is not.
  it.each([
    ["spends the account down to nothing", 40_000, {}],
    ["asks for one zatoshi more than it holds", 40_001, { amount: "NotEnoughBalance" }],
  ] as [string, number, Record<string, string>][])(
    "accepts a send that %s",
    async (_label, amount, errors) => {
      const acc = account({ utxos: [30_000, 20_000] });
      const tx = transaction({
        amount: new BigNumber(amount),
        zcashFee: new BigNumber(10_000),
      });

      expect(errorNames((await getTransactionStatus(acc, tx)).errors)).toEqual(errors);
    },
  );

  it("has nothing to spend on an account with no UTXOs", async () => {
    const status = await getTransactionStatus(account({ utxos: [] }), transaction());

    expect(errorNames(status.errors)).toEqual({ amount: "NotEnoughBalance" });
  });

  it("counts the caller's UTXO selection rather than the whole account", async () => {
    const acc = account({ utxos: [100_000, 25_000] });
    const tx = transaction({
      amount: new BigNumber(50_000),
      zcashFee: new BigNumber(10_000),
      selectedUtxos: [utxo(25_000, 1)],
    });

    expect(errorNames((await getTransactionStatus(acc, tx)).errors)).toEqual({
      amount: "NotEnoughBalance",
    });
  });

  it("reports a zero amount, and accepts it when everything is being sent", async () => {
    const zero = transaction({ amount: new BigNumber(0) });

    expect((await getTransactionStatus(account(), zero)).errors.amount).toEqual(
      new Error("Amount must be positive"),
    );
    expect(
      (await getTransactionStatus(account(), transaction({ ...zero, useAllAmount: true }))).errors,
    ).toEqual({});
  });

  it("reports the recipient and the amount independently", async () => {
    const status = await getTransactionStatus(
      account({ utxos: [1_000] }),
      transaction({ recipient: "", amount: new BigNumber(50_000) }),
    );

    expect(errorNames(status.errors)).toEqual({
      recipient: "RecipientRequired",
      amount: "NotEnoughBalance",
    });
  });

  it("accepts a shielding send to a unified recipient", async () => {
    const status = await getTransactionStatus(
      account(),
      transaction({ transferType: "transparent-to-shielded", recipient: U_ADDRESS }),
    );

    expect(status.errors).toEqual({});
  });

  // Without the UFVK the shielded pools are out of reach, so a shielded
  // recipient has to be refused here -- at the address field, where the user can
  // act on it -- rather than accepted and failed at the device step.
  it("refuses a shielded recipient when the UFVK has not been exported", async () => {
    const status = await getTransactionStatus(
      account({ shieldedKey: false }),
      transaction({ transferType: "transparent-to-shielded", recipient: U_ADDRESS }),
    );

    expect(errorNames(status.errors)).toEqual({ recipient: "ZcashShieldedKeyMissing" });
  });

  // The counterpart, and the flow restored: spending public funds from an
  // account that never exported its UFVK stays available.
  it("still accepts a transparent send when the UFVK has not been exported", async () => {
    const status = await getTransactionStatus(
      account({ shieldedKey: false }),
      transaction({ transferType: "transparent", recipient: T_ADDRESS }),
    );

    expect(status.errors).toEqual({});
  });

  it("rejects a t->t send one zatoshi below the dust threshold", async () => {
    const status = await getTransactionStatus(
      account({ utxos: [1_000_000] }),
      transaction({
        amount: new BigNumber(TRANSPARENT_OUTPUT_DUST_THRESHOLD - 1),
        zcashFee: new BigNumber(10_000),
      }),
    );

    expect(errorNames(status.errors)).toEqual({ amount: "ZcashAmountBelowDustThreshold" });
    expect((status.errors.amount as ZcashAmountBelowDustThreshold).minimumZatoshis).toBe(
      TRANSPARENT_OUTPUT_DUST_THRESHOLD,
    );
  });

  // The bound is exclusive: exactly the threshold is a valid, non-dust send.
  it("accepts a t->t send exactly at the dust threshold", async () => {
    const status = await getTransactionStatus(
      account({ utxos: [1_000_000] }),
      transaction({
        amount: new BigNumber(TRANSPARENT_OUTPUT_DUST_THRESHOLD),
        zcashFee: new BigNumber(10_000),
      }),
    );

    expect(status.errors).toEqual({});
  });

  // A dust amount only matters for a transparent recipient output;
  // "transparent-to-shielded" turns it into an Orchard note.
  it("does not apply the transparent dust rule to a shielding (t->s) send", async () => {
    const status = await getTransactionStatus(
      account({ utxos: [1_000_000] }),
      transaction({
        transferType: "transparent-to-shielded",
        recipient: U_ADDRESS,
        amount: new BigNumber(TRANSPARENT_OUTPUT_DUST_THRESHOLD - 1),
        zcashFee: new BigNumber(10_000),
      }),
    );

    expect(status.errors).toEqual({});
  });
});

describe("getTransactionStatus, bounded-selection shortfall (ZcashSendTooLarge)", () => {
  const FEE = 10_000;

  it.each(["transparent", "transparent-to-shielded"] as ZcashTransferType[])(
    "resolves without an amount error for a %s send within the bounded max, from an account above the bound",
    async transferType => {
      const utxoCount = ZCASH_MAX_TRANSPARENT_INPUTS + 5;
      const acc = account({ utxos: Array(utxoCount).fill(100_000) });
      const boundedBalance = ZCASH_MAX_TRANSPARENT_INPUTS * 100_000;
      const recipient = transferType === "transparent" ? T_ADDRESS : U_ADDRESS;
      const tx = transaction({
        transferType,
        recipient,
        amount: new BigNumber(boundedBalance - FEE),
        zcashFee: new BigNumber(FEE),
      });

      const status = await getTransactionStatus(acc, tx);

      expect(status.errors.amount).toBeUndefined();
    },
  );

  it.each(["transparent", "transparent-to-shielded"] as ZcashTransferType[])(
    "rejects a %s send between the bounded max and the full balance with ZcashSendTooLarge",
    async transferType => {
      const utxoCount = ZCASH_MAX_TRANSPARENT_INPUTS + 5;
      const acc = account({ utxos: Array(utxoCount).fill(100_000) });
      const boundedBalance = ZCASH_MAX_TRANSPARENT_INPUTS * 100_000;
      const fullBalance = utxoCount * 100_000;
      const recipient = transferType === "transparent" ? T_ADDRESS : U_ADDRESS;
      // amount + FEE sits strictly between boundedBalance and fullBalance.
      const tx = transaction({
        transferType,
        recipient,
        amount: new BigNumber(boundedBalance),
        zcashFee: new BigNumber(FEE),
      });

      const status = await getTransactionStatus(acc, tx);

      expect(status.errors.amount).toBeInstanceOf(ZcashSendTooLarge);
      expect(status.errors.amount).not.toBeInstanceOf(NotEnoughBalance);
      expect(boundedBalance + FEE).toBeLessThanOrEqual(fullBalance);
    },
  );

  it("keeps reporting NotEnoughBalance for a genuine shortfall, on an account below the bound", async () => {
    const acc = account({ utxos: [10_000, 10_000, 10_000] }); // full balance 30_000, well below the bound
    const tx = transaction({
      amount: new BigNumber(100_000),
      zcashFee: new BigNumber(FEE),
    });

    const status = await getTransactionStatus(acc, tx);

    expect(status.errors.amount).toEqual(new NotEnoughBalance());
    expect(status.errors.amount).not.toBeInstanceOf(ZcashSendTooLarge);
  });

  it("resolves without an amount error for a shielded send within the bounded max, from a pool above the bound", async () => {
    const noteCount = ZCASH_MAX_IRONWOOD_ACTIONS + 5;
    const acc = account({ ironwoodNotes: Array(noteCount).fill(100_000) });
    const boundedTotal = ZCASH_MAX_IRONWOOD_ACTIONS * 100_000;
    const selectedNotes = Array.from({ length: ZCASH_MAX_IRONWOOD_ACTIONS }, (_, i) =>
      note(100_000, i),
    );
    const tx = transaction({
      transferType: "shielded",
      recipient: U_ADDRESS,
      amount: new BigNumber(boundedTotal - FEE),
      selectedNotes,
      zcashFee: new BigNumber(FEE),
    });

    const status = await getTransactionStatus(acc, tx);

    expect(status.errors.amount).toBeUndefined();
  });

  it("rejects a shielded send between the bounded and full pool with ZcashSendTooLarge, not the generic insufficiency error", async () => {
    const noteCount = ZCASH_MAX_IRONWOOD_ACTIONS + 5;
    const acc = account({ ironwoodNotes: Array(noteCount).fill(100_000) });
    const boundedTotal = ZCASH_MAX_IRONWOOD_ACTIONS * 100_000;
    const fullTotal = noteCount * 100_000;
    const tx = transaction({
      transferType: "shielded",
      recipient: U_ADDRESS,
      amount: new BigNumber(boundedTotal),
      zcashFee: new BigNumber(FEE),
    });

    const status = await getTransactionStatus(acc, tx);

    expect(status.errors.amount).toBeInstanceOf(ZcashSendTooLarge);
    expect(status.errors.amount).not.toEqual(new Error("Insufficient shielded balance"));
    expect(boundedTotal + FEE).toBeLessThanOrEqual(fullTotal);
  });

  it("rejects a shielded-to-transparent send between the bounded and full pool with ZcashSendTooLarge", async () => {
    // shielded-to-transparent (z->t) also spends the Ironwood pool and routes
    // through the same shielded branch of getTransactionStatus as "shielded"
    // -- this is the transfer type the sibling test above doesn't cover.
    const noteCount = ZCASH_MAX_IRONWOOD_ACTIONS + 5;
    const acc = account({ ironwoodNotes: Array(noteCount).fill(100_000) });
    const boundedTotal = ZCASH_MAX_IRONWOOD_ACTIONS * 100_000;
    const fullTotal = noteCount * 100_000;
    const tx = transaction({
      transferType: "shielded-to-transparent",
      recipient: T_ADDRESS,
      amount: new BigNumber(boundedTotal),
      zcashFee: new BigNumber(FEE),
    });

    const status = await getTransactionStatus(acc, tx);

    expect(status.errors.amount).toBeInstanceOf(ZcashSendTooLarge);
    expect(status.errors.amount).not.toEqual(new Error("Insufficient shielded balance"));
    expect(boundedTotal + FEE).toBeLessThanOrEqual(fullTotal);
  });

  it("keeps reporting the generic insufficiency error for a genuine shielded shortfall, on a pool below the bound", async () => {
    const acc = account({ ironwoodNotes: [10_000, 10_000] }); // pool 20_000, well below the bound
    const tx = transaction({
      transferType: "shielded",
      recipient: U_ADDRESS,
      amount: new BigNumber(100_000),
      selectedNotes: [note(20_000)],
      zcashFee: new BigNumber(FEE),
    });

    const status = await getTransactionStatus(acc, tx);

    expect(status.errors.amount).toEqual(new Error("Insufficient shielded balance"));
    expect(status.errors.amount).not.toBeInstanceOf(ZcashSendTooLarge);
  });
});

describe("getTransactionStatus, note-spending flows", () => {
  it("refuses to price anything before the shielded scan has run", async () => {
    const status = await getTransactionStatus(
      account({ synced: false }),
      transaction({ transferType: "shielded", recipient: U_ADDRESS }),
    );

    expect(status).toEqual({
      errors: { account: new Error("Shielded sync not complete") },
      warnings: {},
      estimatedFees: new BigNumber(0),
      amount: new BigNumber(10_000),
      totalSpent: new BigNumber(10_000),
      recipientIsReadOnly: false,
    });
  });

  it("accepts a shielded send its notes and pool cover", async () => {
    const status = await getTransactionStatus(
      account({ orchardBalance: 50_000 }),
      transaction({
        transferType: "shielded",
        recipient: U_ADDRESS,
        selectedNotes: [note(40_000)],
        zcashFee: new BigNumber(15_000),
      }),
    );

    expect(status).toEqual({
      errors: {},
      warnings: {},
      estimatedFees: new BigNumber(15_000),
      amount: new BigNumber(10_000),
      totalSpent: new BigNumber(25_000),
      recipientIsReadOnly: false,
    });
  });

  // A shielded send spends the Ironwood pool, so the Ironwood balance bounds the
  // amount even when the deprecated Orchard pool holds plenty.
  it.each([
    ["shielded", U_ADDRESS],
    ["shielded-to-transparent", T_ADDRESS],
  ] as [ZcashTransferType, string][])(
    "bounds %s by the ironwood balance",
    async (transferType, recipient) => {
      const acc = account({ orchardBalance: 10_000_000, ironwoodNotes: [20_000] });
      const tx = transaction({
        transferType,
        recipient,
        amount: new BigNumber(30_000),
        selectedNotes: [note(1_000_000)],
      });

      expect((await getTransactionStatus(acc, tx)).errors.amount).toEqual(
        new Error("Insufficient shielded balance"),
      );

      const withinPool = transaction({
        transferType,
        recipient,
        amount: new BigNumber(5_000),
        selectedNotes: [note(20_000)],
        zcashFee: new BigNumber(10_000),
      });
      expect((await getTransactionStatus(acc, withinPool)).errors).toEqual({});
    },
  );

  // The amount validated must be the same figure selection draws from, or the
  // status can green-light a send the builder cannot satisfy.
  it("rejects an amount the raw pool covers but the mature figure does not", async () => {
    const acc = account({ ironwoodNotes: [10_000], freshIronwoodNotes: [40_000] });
    const tx = transaction({
      transferType: "shielded",
      recipient: U_ADDRESS,
      amount: new BigNumber(30_000),
      selectedNotes: [note(30_000)],
      zcashFee: new BigNumber(10_000),
    });

    expect((await getTransactionStatus(acc, tx)).errors.amount).toEqual(
      new Error("Insufficient shielded balance"),
    );
  });

  it("accepts an amount within the mature figure", async () => {
    const acc = account({ ironwoodNotes: [10_000], freshIronwoodNotes: [40_000] });
    const tx = transaction({
      transferType: "shielded",
      recipient: U_ADDRESS,
      amount: new BigNumber(5_000),
      selectedNotes: [note(10_000)],
      zcashFee: new BigNumber(5_000),
    });

    expect((await getTransactionStatus(acc, tx)).errors).toEqual({});
  });

  // A shielded-to-transparent recipient is also a transparent output, priced
  // through computeAmountError rather than getTransparentInputStatus, but
  // subject to the same dust rule.
  it("rejects a shielded-to-transparent send one zatoshi below the dust threshold", async () => {
    const status = await getTransactionStatus(
      account(),
      transaction({
        transferType: "shielded-to-transparent",
        recipient: T_ADDRESS,
        amount: new BigNumber(TRANSPARENT_OUTPUT_DUST_THRESHOLD - 1),
        selectedNotes: [note(50_000)],
        zcashFee: new BigNumber(10_000),
      }),
    );

    expect(errorNames(status.errors)).toEqual({ amount: "ZcashAmountBelowDustThreshold" });
  });

  it("accepts a shielded-to-transparent send exactly at the dust threshold", async () => {
    const status = await getTransactionStatus(
      account(),
      transaction({
        transferType: "shielded-to-transparent",
        recipient: T_ADDRESS,
        amount: new BigNumber(TRANSPARENT_OUTPUT_DUST_THRESHOLD),
        selectedNotes: [note(50_000)],
        zcashFee: new BigNumber(10_000),
      }),
    );

    expect(status.errors).toEqual({});
  });

  // A dust amount only matters when the recipient output is transparent; a
  // pure "shielded" (z->z) recipient is an Orchard note.
  it("does not apply the transparent dust rule to a pure shielded (z->z) send", async () => {
    const status = await getTransactionStatus(
      account(),
      transaction({
        transferType: "shielded",
        recipient: U_ADDRESS,
        amount: new BigNumber(TRANSPARENT_OUTPUT_DUST_THRESHOLD - 1),
        selectedNotes: [note(50_000)],
        zcashFee: new BigNumber(10_000),
      }),
    );

    expect(status.errors).toEqual({});
  });

  it("refuses a shielded send that selected no note, however full the pool", async () => {
    const status = await getTransactionStatus(
      account({ orchardBalance: 10_000_000 }),
      transaction({ transferType: "shielded", recipient: U_ADDRESS }),
    );

    expect(status.errors.amount).toEqual(new Error("Insufficient shielded balance"));
  });

  it("reports a sapling recipient as unsupported", async () => {
    const status = await getTransactionStatus(
      account(),
      transaction({
        transferType: "shielded",
        recipient: ZS_ADDRESS,
        selectedNotes: [note(40_000)],
      }),
    );

    expect(errorNames(status.errors)).toEqual({
      recipient: "ZcashSaplingRecipientNotSupported",
    });
  });
});

// The fee is resolved by prepareTransaction and only carried by
// getTransactionStatus, so the two are chained here -- setting `zcashFee` by hand
// would assert nothing about the ZIP-317 computation behind the figure the flow
// shows. Each row spells out its logical-action count, so a fee pinned to the
// 2-action floor passes the first row and fails the rest.
describe("getTransactionStatus, ZIP-317 fee surfaced by the flow", () => {
  it.each([
    [
      "a t->t send over one UTXO (max(1 in, 2 out) = 2 actions)",
      "10000",
      account({ utxos: [100_000] }),
      transaction({ amount: new BigNumber(30_000) }),
    ],
    [
      "a t->t send over three UTXOs (max(3 in, 2 out) = 3 actions)",
      "15000",
      account({ utxos: [50_000, 50_000, 50_000] }),
      transaction({ amount: new BigNumber(30_000) }),
    ],
    [
      "a shielding send (1 transparent in + Orchard floor of 2 = 3 actions)",
      "15000",
      account({ utxos: [100_000] }),
      transaction({
        transferType: "transparent-to-shielded",
        recipient: U_ADDRESS,
        amount: new BigNumber(30_000),
      }),
    ],
    [
      "a z->t send (Orchard floor of 2 + 1 transparent out = 3 actions)",
      "15000",
      account({ ironwoodNotes: [50_000] }),
      transaction({
        transferType: "shielded-to-transparent",
        recipient: T_ADDRESS,
        amount: new BigNumber(20_000),
      }),
    ],
  ] as [string, string, ZcashAccount, Transaction][])(
    "prices %s at %s zatoshi",
    async (_label, expectedFee, acc, tx) => {
      const prepared = await prepareTransaction(acc, tx);
      const status = await getTransactionStatus(acc, prepared);

      expect(status.errors).toEqual({});
      expect(status.estimatedFees.toString()).toBe(expectedFee);
      expect(status.totalSpent).toEqual(prepared.amount.plus(new BigNumber(expectedFee)));
    },
  );

  // The same layout priced above at 15_000 must not fall back to the floor, which
  // is what a constant fee would surface.
  it("does not surface the minimum for a 3-action layout", async () => {
    const acc = account({ utxos: [50_000, 50_000, 50_000] });

    const prepared = await prepareTransaction(acc, transaction({ amount: new BigNumber(30_000) }));
    const status = await getTransactionStatus(acc, prepared);

    expect(status.estimatedFees.toNumber()).not.toBe(ZIP317_MINIMUM_FEE);
  });
});

describe("getTransactionStatus, memo byte limit", () => {
  it.each([
    [
      "transparent-input",
      transaction({ transferType: "transparent-to-shielded", recipient: U_ADDRESS }),
    ],
    ["note-spending", transaction({ transferType: "shielded", recipient: U_ADDRESS })],
  ])("rejects an oversized UTF-8 memo for %s flows", async (_label, tx) => {
    const status = await getTransactionStatus(account(), { ...tx, memo: "😀".repeat(129) });

    expect(status.errors.transaction?.name).toBe("ZcashMemoTooLong");
  });

  it("accepts a memo at exactly 512 UTF-8 bytes", async () => {
    const status = await getTransactionStatus(
      account(),
      transaction({
        transferType: "transparent-to-shielded",
        recipient: U_ADDRESS,
        memo: "😀".repeat(128),
      }),
    );

    expect(status.errors.transaction).toBeUndefined();
  });
});

describe("getTransactionStatus, recipientIsReadOnly", () => {
  it.each([
    ["transparent-input", transaction({ selfTransfer: true }), account()],
    [
      "shielded",
      transaction({ transferType: "shielded", recipient: U_ADDRESS, selfTransfer: true }),
      account(),
    ],
    [
      "no-privateInfo",
      transaction({ transferType: "shielded", recipient: U_ADDRESS, selfTransfer: true }),
      account({ synced: false }),
    ],
  ] as [string, Transaction, ZcashAccount][])(
    "is true on the %s return point when selfTransfer is true",
    async (_label, tx, acc) => {
      expect((await getTransactionStatus(acc, tx)).recipientIsReadOnly).toBe(true);
    },
  );

  it.each([
    ["transparent-input", transaction(), account()],
    ["transparent-input, explicit false", transaction({ selfTransfer: false }), account()],
    [
      "shielded",
      transaction({
        transferType: "shielded",
        recipient: U_ADDRESS,
        selectedNotes: [note(40_000)],
      }),
      account(),
    ],
    [
      "no-privateInfo",
      transaction({ transferType: "shielded", recipient: U_ADDRESS }),
      account({ synced: false }),
    ],
  ] as [string, Transaction, ZcashAccount][])(
    "is false on the %s return point when selfTransfer is absent or false",
    async (_label, tx, acc) => {
      expect((await getTransactionStatus(acc, tx)).recipientIsReadOnly).toBe(false);
    },
  );

  it("adds no error and removes none: selfTransfer gates exactly as a manually typed address", async () => {
    const withFlag = transaction({ selfTransfer: true, amount: new BigNumber(30_000) });
    const withoutFlag = transaction({ amount: new BigNumber(30_000) });

    const [statusWithFlag, statusWithoutFlag] = await Promise.all([
      getTransactionStatus(account(), withFlag),
      getTransactionStatus(account(), withoutFlag),
    ]);

    expect(errorNames(statusWithFlag.errors)).toEqual(errorNames(statusWithoutFlag.errors));
    expect(Object.keys(statusWithFlag.warnings)).toEqual(Object.keys(statusWithoutFlag.warnings));
  });
});
