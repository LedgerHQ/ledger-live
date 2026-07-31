import { BigNumber } from "bignumber.js";
import { prepareTransaction } from "./prepareTransaction";
import { estimateMaxSpendable } from "./estimateMaxSpendable";
import { ZIP317_MINIMUM_FEE } from "../logic/coin-selection";
import type { BitcoinOutput, Transaction, ZcashAccount, ZcashTransferType } from "../types/bridge";

const T_ADDRESS = "t1b1Rbw2shhJkP6MCnCyxCPuyFedHrwKty8";
const U_ADDRESS =
  "u1u2h4ce7e2cn3z4nzur95muq2dl4da9x8h8kdp2l80gm9nl9raj8zzpx79ycjnfvar4v5exea5pqr5y9qsnlp0cdunwf9yjjx5c4q7ar9";

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

const utxo = (value: number, outputIndex: number): BitcoinOutput => ({
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
  notes = [40_000, 10_000],
  ironwoodNotes = [30_000, 20_000],
}: { utxos?: number[]; notes?: number[]; ironwoodNotes?: number[] } = {}): ZcashAccount {
  return {
    type: "Account",
    id: "js:2:zcash:xpub6D:",
    currency: { id: "zcash", name: "Zcash" },
    bitcoinResources: { utxos: utxos.map((value, i) => utxo(value, i)) },
    privateInfo: {
      transactions: [
        {
          id: "932c99c7",
          hex: "00",
          blockHeight: 3_425_862,
          blockHash: "cc".repeat(32),
          timestamp: 1_700_000_000,
          fee: new BigNumber(15_000),
          decryptedData: {
            orchard_outputs: notes.map(note),
            sapling_outputs: [],
            // Offset so the two pools never share a nullifier or a position.
            ironwood_outputs: ironwoodNotes.map((amount, i) => note(amount, i + 100)),
          },
        },
      ],
    },
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

const sum = (values: BigNumber[]): BigNumber =>
  values.reduce((total, v) => total.plus(v), new BigNumber(0));

describe("prepareTransaction, transparent-input flows", () => {
  // Fees are the ZIP-317 figure for the flow's action layout, spelled out here
  // because the native builder rejects any fee that is not exactly that:
  // t→t spends 1 UTXO into recipient + change (2 transparent actions, 10k),
  // while t→z pays 2 Orchard outputs on top of 1 transparent input (3, 15k).
  it.each([
    ["transparent", T_ADDRESS, 10_000, 60_000],
    ["transparent-to-shielded", U_ADDRESS, 15_000, 55_000],
  ] as [ZcashTransferType, string, number, number][])(
    "prices %s over its UTXOs and returns the rest as change",
    async (transferType, recipient, fee, change) => {
      const acc = account({ utxos: [100_000] });
      const tx = transaction({ transferType, recipient, amount: new BigNumber(30_000) });

      const prepared = await prepareTransaction(acc, tx);

      expect(prepared).toMatchObject({
        amount: new BigNumber(30_000),
        zcashFee: new BigNumber(fee),
        changeAmount: new BigNumber(change),
        selectedNotes: [],
      });
    },
  );

  it("spends every UTXO, leaving no change, when the amount is not set by the user", async () => {
    const acc = account({ utxos: [100_000, 25_000] });

    const prepared = await prepareTransaction(acc, transaction({ useAllAmount: true }));

    // 2 inputs into a single recipient output: 2 actions, so 10k of the 125k.
    expect(prepared).toMatchObject({
      amount: new BigNumber(115_000),
      zcashFee: new BigNumber(10_000),
      changeAmount: new BigNumber(0),
    });
  });

  it("recomputes the max from the current UTXO set rather than a stale amount", async () => {
    const acc = account({ utxos: [50_000] });
    const stale = transaction({ useAllAmount: true, amount: new BigNumber(9_999_999) });

    const prepared = await prepareTransaction(acc, stale);

    expect(prepared.amount).toEqual(new BigNumber(40_000));
  });

  it.each([
    ["the UTXOs cannot cover the send", [1_000], 500_000, false],
    // An account whose whole balance is the fee has nothing spendable: the max
    // is zero, and a zero-amount send is not a transaction.
    ["the balance is worth exactly its own fee", [10_000], 0, true],
  ] as [string, number[], number, boolean][])(
    "clears the fee and change when %s",
    async (_label, utxos, amount, useAllAmount) => {
      const tx = transaction({
        amount: new BigNumber(amount),
        useAllAmount,
        zcashFee: new BigNumber(15_000),
        changeAmount: new BigNumber(1_000),
      });

      const prepared = await prepareTransaction(account({ utxos }), tx);

      // A stale fee from an earlier prepare must not survive: the UI would show
      // a spendable amount with a fee that no longer applies to it.
      expect(prepared).not.toHaveProperty("zcashFee");
      expect(prepared).not.toHaveProperty("changeAmount");
      expect(prepared.selectedNotes).toEqual([]);
      expect(prepared.amount).toEqual(new BigNumber(useAllAmount ? 0 : amount));
    },
  );

  it("honours the caller's UTXO selection over the synced set", async () => {
    const acc = account({ utxos: [100_000, 25_000] });
    const tx = transaction({ useAllAmount: true, selectedUtxos: [utxo(25_000, 1)] });

    const prepared = await prepareTransaction(acc, tx);

    expect(prepared).toMatchObject({
      amount: new BigNumber(15_000),
      zcashFee: new BigNumber(10_000),
    });
  });
});

describe("prepareTransaction, note-spending flows", () => {
  // Selection is largest-first, and the fee is resolved iteratively because it
  // depends on how many notes were selected. A shielded send spends the Ironwood
  // pool (30k/20k). Sending 25k out of that 50k pool:
  //   z→z  both notes are needed; 2 Orchard-family actions (10k fee), 15k change
  //   z→t  the transparent output costs a third action, so 15k fee and 10k change
  it.each([
    ["shielded", U_ADDRESS, [30_000, 20_000], 10_000, 15_000],
    ["shielded-to-transparent", T_ADDRESS, [30_000, 20_000], 15_000, 10_000],
  ] as [ZcashTransferType, string, number[], number, number][])(
    "selects the notes %s spends, and prices them",
    async (transferType, recipient, selection, fee, change) => {
      const prepared = await prepareTransaction(
        account(),
        transaction({ transferType, recipient, amount: new BigNumber(25_000) }),
      );

      expect(prepared.selectedNotes?.map(n => n.amount.toNumber())).toEqual(selection);
      expect(prepared).toMatchObject({
        amount: new BigNumber(25_000),
        zcashFee: new BigNumber(fee),
        changeAmount: new BigNumber(change),
      });
      // What is spent has to close: inputs = amount + fee + change.
      expect(sum(prepared.selectedNotes?.map(n => n.amount) ?? [])).toEqual(
        new BigNumber(25_000 + fee + change),
      );
    },
  );

  // A shielded send spends the Ironwood pool only. The deprecated Orchard pool is
  // never drawn on, even when it holds far more than the send needs.
  it("never lets a shielded send draw on the Orchard pool", async () => {
    const prepared = await prepareTransaction(
      account({ notes: [1_000_000], ironwoodNotes: [20_000] }),
      transaction({
        transferType: "shielded",
        recipient: U_ADDRESS,
        amount: new BigNumber(500_000),
      }),
    );

    expect(prepared.selectedNotes).toEqual([]);
    expect(prepared).not.toHaveProperty("zcashFee");
  });

  it("spends the whole pool, leaving no change, when everything is being sent", async () => {
    const prepared = await prepareTransaction(
      account({ notes: [40_000, 10_000] }),
      transaction({ transferType: "shielded", recipient: U_ADDRESS, useAllAmount: true }),
    );

    expect(prepared.selectedNotes?.map(n => n.amount.toNumber())).toEqual([40_000, 10_000]);
    expect(prepared).toMatchObject({
      amount: new BigNumber(40_000),
      zcashFee: new BigNumber(10_000),
      changeAmount: new BigNumber(0),
    });
  });

  // Change worth less than one action costs more to spend than it holds, so it
  // goes to the fee instead of becoming a note nobody can use.
  it("absorbs dust change into the fee rather than leaving an unspendable note", async () => {
    const prepared = await prepareTransaction(
      account({ notes: [40_000] }),
      transaction({
        transferType: "shielded",
        recipient: U_ADDRESS,
        amount: new BigNumber(28_000),
      }),
    );

    expect(prepared).toMatchObject({
      zcashFee: new BigNumber(12_000),
      changeAmount: new BigNumber(0),
    });
  });

  it.each([
    ["the pool is empty", account({ notes: [] })],
    ["the account has never been synced", { ...account(), privateInfo: undefined }],
  ])("clears the selection when %s", async (_label, acc) => {
    const prepared = await prepareTransaction(
      acc as unknown as ZcashAccount,
      transaction({ transferType: "shielded", recipient: U_ADDRESS, useAllAmount: true }),
    );

    expect(prepared.amount).toEqual(new BigNumber(0));
    expect(prepared.selectedNotes).toEqual([]);
    expect(prepared).not.toHaveProperty("zcashFee");
  });
});

describe("estimateMaxSpendable", () => {
  const max = (tx: Transaction | null, acc = account()) =>
    estimateMaxSpendable({ account: acc, transaction: tx } as never);

  // Each flow's pool, minus the fee for spending all of it into a single
  // output: 125k of UTXOs costs 2 actions t→t, and 4 as a shielding (the
  // Orchard bundle is floored to 2 on top of the 2 transparent inputs); a 50k
  // pool of two notes costs 2 actions, 3 when the recipient is transparent.
  it.each([
    ["transparent", 115_000],
    ["transparent-to-shielded", 105_000],
    ["shielded", 40_000],
    ["shielded-to-transparent", 35_000],
  ] as [ZcashTransferType, number][])(
    "answers for %s with the pool it spends, minus the fee",
    async (transferType, spendable) => {
      expect(await max(transaction({ transferType }))).toEqual(new BigNumber(spendable));
    },
  );

  it("falls back to the transparent pool when there is no transaction yet", async () => {
    expect(await max(null)).toEqual(new BigNumber(115_000));
  });

  it.each(["transparent", "transparent-to-shielded", "shielded"] as ZcashTransferType[])(
    "answers zero for an empty pool (%s)",
    async transferType => {
      const empty = account({ utxos: [], notes: [], ironwoodNotes: [] });

      expect(await max(transaction({ transferType }), empty)).toEqual(new BigNumber(0));
    },
  );

  // A balance worth exactly its own fee leaves nothing to send, and the answer
  // has to be zero rather than the negative amount the subtraction gives.
  it("answers zero when the whole balance would go to the fee", async () => {
    const dust = account({ utxos: [ZIP317_MINIMUM_FEE] });

    expect(await max(transaction({ transferType: "transparent" }), dust)).toEqual(new BigNumber(0));
  });

  it("counts the caller's UTXO selection rather than the whole account", async () => {
    const acc = account({ utxos: [100_000, 25_000] });

    expect(await max(transaction({ selectedUtxos: [utxo(25_000, 1)] }), acc)).toEqual(
      new BigNumber(15_000),
    );
  });
});
