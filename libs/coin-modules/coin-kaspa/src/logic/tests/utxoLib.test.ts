import { BigNumber } from "bignumber.js";
import { calcMaxSpendableAmount, sortUtxos } from "../utxos/lib";
import { KaspaUtxoGenerator } from "./utxoSelection.test";

describe("calcMaxSpendableAmount", () => {
  it("should calculate max spendable amount correctly with default fee rate", () => {
    const utxos = KaspaUtxoGenerator.generateUtxoSet(5, new BigNumber(1_0000_0000), "12345");
    const isEcdsaRecipient = false;

    const result = calcMaxSpendableAmount(utxos, isEcdsaRecipient);
    expect(result.toNumber()).toBe(5_0000_0000 - 5 * 1118 - 506);
  });

  it("should calculate max spendable amount correctly with default fee rate", () => {
    const utxos = KaspaUtxoGenerator.generateUtxoSet(5, new BigNumber(1_0000_0000), "12345");
    const isEcdsaRecipient = false;

    const result = calcMaxSpendableAmount(utxos, isEcdsaRecipient, 14);
    expect(result.toNumber()).toBe(5_0000_0000 - (5 * 1118 + 506) * 14);
  });

  it("high fee forces to calculate 0", () => {
    const utxos = KaspaUtxoGenerator.generateUtxoSet(5, new BigNumber(1_0000_0000), "12345");
    const isEcdsaRecipient = false;

    const result = calcMaxSpendableAmount(utxos, isEcdsaRecipient, 100_000);
    expect(result.toNumber()).toBe(0);
  });

  it("should subtract ECDSA mass penalty scaled by feerate=1", () => {
    const utxos = KaspaUtxoGenerator.generateUtxoSet(5, new BigNumber(1_0000_0000), "12345");

    const result = calcMaxSpendableAmount(utxos, true, 1);
    // (506 + 5*1118 + 11) * 1 = 6107
    expect(result.toNumber()).toBe(5_0000_0000 - 6107);
  });

  it("should subtract ECDSA mass penalty scaled by feerate=14", () => {
    const utxos = KaspaUtxoGenerator.generateUtxoSet(5, new BigNumber(1_0000_0000), "12345");

    const result = calcMaxSpendableAmount(utxos, true, 14);
    // (506 + 5*1118 + 11) * 14 = 85498
    expect(result.toNumber()).toBe(5_0000_0000 - 85498);
  });
});

describe("sortUtxos", () => {
  // Regression test for a real bug: blockDaaScore is a numeric string, and comparing it with
  // .localeCompare() (lexicographic) is wrong the moment two scores have different digit
  // counts — e.g. "1202" < "200" as strings, even though 1202 > 200 numerically. This let a
  // fresh, immature coinbase UTXO get selected ahead of a genuinely old, mature one, causing
  // kaspad to reject the broadcast for spending an immature UTXO.
  it("orders UTXOs by numeric DAA score, not lexicographic string order", () => {
    const scores = ["9", "10", "99", "100", "999", "1000", "1202", "200"];
    const utxos = scores.map(score => KaspaUtxoGenerator.generateUtxo(new BigNumber(1), score));

    sortUtxos(utxos);

    expect(utxos.map(u => u.utxoEntry.blockDaaScore)).toEqual([
      "9",
      "10",
      "99",
      "100",
      "200",
      "999",
      "1000",
      "1202",
    ]);
  });

  it("never ranks a higher DAA score (newer) ahead of a lower one (older) across a digit boundary", () => {
    // The exact real-world shape that triggered the bug: a handful of old, mature 1-3 digit
    // UTXOs alongside a couple of fresh 4-digit confirmation-block UTXOs.
    const older = KaspaUtxoGenerator.generateUtxo(new BigNumber(1), "200");
    const fresh = KaspaUtxoGenerator.generateUtxo(new BigNumber(1), "1202");
    const utxos = [fresh, older];

    sortUtxos(utxos);

    expect(utxos[0]).toBe(older);
    expect(utxos[1]).toBe(fresh);
  });

  it("falls back to amount ascending when DAA scores are equal", () => {
    const utxos = [
      KaspaUtxoGenerator.generateUtxo(new BigNumber(300), "50"),
      KaspaUtxoGenerator.generateUtxo(new BigNumber(100), "50"),
      KaspaUtxoGenerator.generateUtxo(new BigNumber(200), "50"),
    ];

    sortUtxos(utxos);

    expect(utxos.map(u => u.utxoEntry.amount.toNumber())).toEqual([100, 200, 300]);
  });
});
