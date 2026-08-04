import { BigNumber } from "bignumber.js";
import { getTransactionStatus } from "./getTransactionStatus";
import {
  computeAmountError,
  computeRecipientError,
  isTransparentInputTransfer,
  resolveTransparentUtxos,
} from "./statusHelpers";
import { ZIP317_MINIMUM_FEE } from "../logic/coin-selection";
import type { BitcoinOutput, Transaction, ZcashAccount, ZcashTransferType } from "../types/bridge";
import type { SpendableNote } from "../network/types";

const T_ADDRESS = "t1b1Rbw2shhJkP6MCnCyxCPuyFedHrwKty8";
const U_ADDRESS =
  "u1u2h4ce7e2cn3z4nzur95muq2dl4da9x8h8kdp2l80gm9nl9raj8zzpx79ycjnfvar4v5exea5pqr5y9qsnlp0cdunwf9yjjx5c4q7ar9";
const ZS_ADDRESS = "zs1z7rejlpsa98s2rrrfkwmaxu53e4ue0ulcrw0h4x5g8jl04tak0d3mm47vdtahatqrlkngh9slya";

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
  ironwoodBalance = 50_000,
  synced = true,
}: {
  utxos?: number[];
  orchardBalance?: number;
  ironwoodBalance?: number;
  synced?: boolean;
} = {}): ZcashAccount {
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
    expect(computeRecipientError(recipient, "Zcash")?.name).toBe(expected);
  });

  it.each([T_ADDRESS, U_ADDRESS])("accepts %s", recipient => {
    expect(computeRecipientError(recipient, "Zcash")).toBe(undefined);
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
      const acc = account({ orchardBalance: 10_000_000, ironwoodBalance: 20_000 });
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
