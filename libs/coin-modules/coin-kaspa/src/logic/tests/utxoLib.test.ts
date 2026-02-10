import { BigNumber } from "bignumber.js";
import { calcMaxSpendableAmount } from "../utxos/lib";
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
});
