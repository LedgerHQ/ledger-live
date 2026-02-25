import BigNumber from "bignumber.js";
import {
  canStake,
  isAlreadyStaking,
  isValidNumString,
  selectMinimumUtxos,
  getTyphonInputFromUtxo,
} from "./logic";
import { CardanoAccount, CardanoOutput } from "./types";

describe("canStake", () => {
  it("should return false when acc has no funds", () => {
    const accWithNoFunds = {
      balance: new BigNumber(0),
    } as CardanoAccount;
    expect(canStake(accWithNoFunds)).toEqual(false);
  });

  it("should return true when acc has funds", () => {
    const accWithFunds = {
      balance: new BigNumber(1),
    } as CardanoAccount;
    expect(canStake(accWithFunds)).toEqual(true);
  });
});

describe("isAlreadyStaking", () => {
  it("should return false when acc isn't delegating", () => {
    const noResourcesAcc = {} as CardanoAccount;
    expect(isAlreadyStaking(noResourcesAcc)).toEqual(false);
    const noDelegationAcc = {
      cardanoResources: {},
    } as CardanoAccount;
    expect(isAlreadyStaking(noDelegationAcc)).toEqual(false);
    const noPoolIdAcc = { cardanoResources: { delegation: {} } } as CardanoAccount;
    expect(isAlreadyStaking(noPoolIdAcc)).toEqual(false);
  });

  it("should return true when acc is delegating", () => {
    const noResourcesAcc = {
      cardanoResources: { delegation: { poolId: "itspoolid" } },
    } as CardanoAccount;
    expect(isAlreadyStaking(noResourcesAcc)).toEqual(true);
  });
});

describe("isValidNumString", () => {
  it("should return false for invalid number", () => {
    expect(isValidNumString("")).toEqual(false);
    expect(isValidNumString(undefined)).toEqual(false);
    expect(isValidNumString(null)).toEqual(false);
    expect(isValidNumString({})).toEqual(false);
    expect(isValidNumString([])).toEqual(false);
  });

  it("should return true for valid number", () => {
    expect(isValidNumString(123)).toEqual(true);
    expect(isValidNumString(123.321)).toEqual(true);
    expect(isValidNumString("123")).toEqual(true);
    expect(isValidNumString("123.321")).toEqual(true);
  });
});

describe("selectMinimumUtxos", () => {
  const createUtxo = (amount: number): CardanoOutput => {
    return {
      amount: new BigNumber(amount),
    } as CardanoOutput;
  };

  it("should return empty array if no utxos are provided", () => {
    const utxos: Array<CardanoOutput> = [];
    const result = selectMinimumUtxos(utxos, new BigNumber(100));
    expect(result).toEqual([]);
  });

  it("should select single utxo if it covers the amount + buffer", () => {
    const utxo1 = createUtxo(20e6);
    const utxo2 = createUtxo(5e6);
    const utxos = [utxo1, utxo2];

    const result = selectMinimumUtxos(utxos, new BigNumber(5e6));
    expect(result.length).toBe(1);
    expect(result[0]).toBe(utxo1);
  });

  it("should select multiple utxos to cover the amount + buffer prioritizing higher amounts", () => {
    const utxo1 = createUtxo(4e6);
    const utxo2 = createUtxo(8e6);
    const utxo3 = createUtxo(6e6);
    const utxos = [utxo1, utxo2, utxo3];

    const result = selectMinimumUtxos(utxos, new BigNumber(2e6));
    expect(result.length).toBe(2);
    expect(result[0]).toBe(utxo2);
    expect(result[1]).toBe(utxo3);
  });

  it("should select all utxos if total amount is less than required", () => {
    const utxo1 = createUtxo(4e6);
    const utxo2 = createUtxo(2e6);
    const utxos = [utxo1, utxo2];

    const result = selectMinimumUtxos(utxos, new BigNumber(10e6));
    expect(result.length).toBe(2);
    expect(result).toEqual([utxo1, utxo2]);
  });
});

describe("getTyphonInputFromUtxo", () => {
  it("should return a Typhon Input from a CardanoOutput", () => {
    const mockUtxo: CardanoOutput = {
      address: "0000000000000000000000000000000000000000000000000000000000=",
      paymentCredential: {
        key: "mockKey",
        path: {
          purpose: 1852,
          coin: 1815,
          account: 0,
          chain: 0,
          index: 0,
        },
      },
      hash: "mockTxId",
      index: 0,
      amount: new BigNumber(100),
      tokens: [],
    } as unknown as CardanoOutput;

    const typhonInput = getTyphonInputFromUtxo(mockUtxo);

    expect(typhonInput.txId).toEqual("mockTxId");
    expect(typhonInput.index).toEqual(0);
    expect(typhonInput.amount).toEqual(new BigNumber(100));
    expect(typhonInput.tokens).toEqual([]);
    expect(typhonInput.address).toBeDefined();
  });
});
