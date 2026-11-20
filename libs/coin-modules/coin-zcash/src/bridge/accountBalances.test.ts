import BigNumber from "bignumber.js";
import { makeZcashAccountBalances } from "./accountBalances";
import { getSpendableIronwoodBalance } from "../logic/account/spendability";
import { getReservedNullifiers } from "./note-reservation";
import { ZCASH_SHIELDED_SPENDABILITY_DELAY_BLOCKS } from "../constants";
import type { ZcashAccount } from "../types/bridge";

const REFERENCE_HEIGHT = 3_450_000;
const MATURE_HEIGHT = REFERENCE_HEIGHT - ZCASH_SHIELDED_SPENDABILITY_DELAY_BLOCKS;

const nullifierAt = (index: number) => index.toString(16).padStart(2, "0").repeat(32);

const utxo = (hash: string, outputIndex: number, value: number) => ({
  hash,
  outputIndex,
  value: new BigNumber(value),
  blockHeight: 1,
  address: "t1",
  rbf: false,
  isChange: false,
});

type NoteSpec = { amount: number; blockHeight: number };

const privateInfo = (notes: NoteSpec[]) => ({
  lastProcessedBlock: REFERENCE_HEIGHT,
  transactions: notes.map((spec, i) => ({
    id: `tx-${i}`,
    hex: "00",
    blockHeight: spec.blockHeight,
    blockHash: "cc".repeat(32),
    timestamp: 1_700_000_000,
    fee: new BigNumber(0),
    decryptedData: {
      orchard_outputs: [],
      sapling_outputs: [],
      ironwood_outputs: [
        {
          amount: new BigNumber(spec.amount),
          transfer_type: "incoming",
          memo: "",
          nullifier: nullifierAt(i),
          rho: "ee".repeat(32),
          rseed: "ff".repeat(32),
          cmx: "11".repeat(32),
          position: String(i),
          recipient: "22".repeat(43),
          isSpent: false,
        },
      ],
    },
  })),
});

function makeAccount({
  utxos = [],
  notes,
  ironwoodBalance,
  pendingExtras = [],
}: {
  utxos?: ReturnType<typeof utxo>[];
  notes?: NoteSpec[];
  ironwoodBalance?: number;
  pendingExtras?: unknown[];
}): ZcashAccount {
  const transparent = utxos.reduce((sum, u) => sum.plus(u.value), new BigNumber(0));
  return {
    id: "zcash-account",
    blockHeight: REFERENCE_HEIGHT,
    balance: transparent.plus(ironwoodBalance ?? 0),
    bitcoinResources: { utxos },
    pendingOperations: pendingExtras.map(extra => ({ extra })),
    ...(notes && { privateInfo: privateInfo(notes) }),
  } as unknown as ZcashAccount;
}

const rowsOf = (account: ZcashAccount, shielded: boolean) => {
  const rows = makeZcashAccountBalances(() => shielded)(account).account;
  if (!rows) throw new Error("expected account rows");
  return rows;
};

const sum = (values: BigNumber[]) => values.reduce((a, b) => a.plus(b), new BigNumber(0));

describe("makeZcashAccountBalances", () => {
  it("emits a transparent row and an Ironwood private row that add up to the balance", () => {
    const account = makeAccount({
      utxos: [utxo("a", 0, 100), utxo("b", 1, 50)],
      notes: [{ amount: 300, blockHeight: MATURE_HEIGHT }],
      ironwoodBalance: 300,
    });

    const rows = rowsOf(account, true);

    expect(rows).toEqual([
      { value: new BigNumber(150), locked: new BigNumber(0), pool: "transparent" },
      { value: new BigNumber(300), locked: new BigNumber(0), pool: "ironwood", private: true },
    ]);
    expect(sum(rows.map(r => r.value))).toEqual(account.balance);
  });

  it("emits the transparent row alone, equal to the balance, when shielded is disabled", () => {
    const account = makeAccount({ utxos: [utxo("a", 0, 100)] });

    const rows = rowsOf(account, false);

    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ value: account.balance, pool: "transparent" });
    expect(rows[0].private).toBeUndefined();
  });

  it("locks exactly the UTXOs still in the set that a pending operation spends", () => {
    const account = makeAccount({
      utxos: [utxo("a", 0, 100), utxo("b", 1, 50), utxo("c", 2, 25)],
      pendingExtras: [
        {
          inputRefs: [
            { hash: "a", outputIndex: 0, address: "t1" },
            { hash: "gone", outputIndex: 3, address: "t1" },
          ],
        },
        undefined,
        { inputRefs: "not-an-array" },
      ],
    });

    const [transparent] = rowsOf(account, false);

    expect(transparent.value).toEqual(new BigNumber(175));
    expect(transparent.locked).toEqual(new BigNumber(100));
  });

  it("matches the spendable Ironwood figure with a reserved note and an immature note", () => {
    const account = makeAccount({
      utxos: [utxo("a", 0, 10)],
      notes: [
        { amount: 200, blockHeight: MATURE_HEIGHT },
        { amount: 70, blockHeight: MATURE_HEIGHT },
        { amount: 30, blockHeight: REFERENCE_HEIGHT },
      ],
      ironwoodBalance: 300,
      pendingExtras: [{ shieldedNullifiers: [nullifierAt(1)] }],
    });

    const ironwood = rowsOf(account, true)[1];
    const spendable = getSpendableIronwoodBalance(account, getReservedNullifiers(account));

    expect(spendable).toEqual(new BigNumber(200));
    expect(ironwood.value.minus(ironwood.locked ?? 0)).toEqual(spendable);
    expect(ironwood.locked).toEqual(new BigNumber(100));
  });

  it("keeps every row inside 0 <= locked <= value without privateInfo", () => {
    const account = makeAccount({ utxos: [utxo("a", 0, 10)], ironwoodBalance: 40 });

    for (const row of rowsOf(account, true)) {
      expect(row.locked?.gte(0)).toBe(true);
      expect(row.locked?.lte(row.value)).toBe(true);
    }
    expect(rowsOf(account, true)[1]).toMatchObject({
      value: new BigNumber(40),
      locked: new BigNumber(40),
    });
  });

  it("clamps locked to the value when the notes sum above the Ironwood balance", () => {
    const account = makeAccount({
      utxos: [],
      notes: [{ amount: 500, blockHeight: MATURE_HEIGHT }],
      ironwoodBalance: 100,
    });

    const [, ironwood] = rowsOf(account, true);

    expect(ironwood.value).toEqual(new BigNumber(100));
    expect(ironwood.locked).toEqual(new BigNumber(0));
  });

  it("reads the shielded switch at sync time", () => {
    let enabled = false;
    const balances = makeZcashAccountBalances(() => enabled);
    const account = makeAccount({ utxos: [utxo("a", 0, 10)] });

    expect(balances(account).account).toHaveLength(1);
    enabled = true;
    expect(balances(account).account).toHaveLength(2);
  });

  it("tolerates an account without bitcoin resources", () => {
    const account = {
      id: "x",
      balance: new BigNumber(0),
      pendingOperations: [],
    } as unknown as ZcashAccount;

    expect(rowsOf(account, false)[0].value).toEqual(new BigNumber(0));
  });
});
