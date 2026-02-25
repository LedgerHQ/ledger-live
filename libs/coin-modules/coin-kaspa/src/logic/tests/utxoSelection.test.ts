import { BigNumber } from "bignumber.js";
import { KaspaUtxo } from "../../types";
import * as lib from "../utxos/lib";
import { selectUtxos } from "../utxos/selection";

jest.mock("../utxos/lib", () => {
  const actual = jest.requireActual("../utxos/lib");
  return {
    ...actual,
    calcMaxSpendableAmount: jest.fn(actual.calcMaxSpendableAmount),
  };
});

const mockCalcMaxSpendableAmount = lib.calcMaxSpendableAmount as jest.Mock;

const TX_MASS_PER_INPUT = 1118;
const TX_MASS_FOR_TWO_OUTPUTS = 918;
const TX_MASS_FOR_ECDSA = 11;

export class KaspaUtxoGenerator {
  static generateUtxo(amount: BigNumber, blockDaaScore: string): KaspaUtxo {
    return {
      address: "kaspa:qrp78nf43jaz3zk0j4dxga4ncdzk95xhun95hp6scyh6g6z7kwugy02wfw6ee",
      outpoint: {
        transactionId: this.generateRandomTransactionId(),
        index: this.generateRandomIndex(),
      },
      utxoEntry: {
        amount,
        scriptPublicKey: {
          version: 0,
          scriptPublicKey: this.generateRandomScriptPublicKey(),
        },
        blockDaaScore,
        isCoinbase: true,
      },
      accountType: 0,
      accountIndex: 4,
    } as KaspaUtxo;
  }

  static generateUtxoSet(
    count: number,
    amount: BigNumber,
    startBlockDaaScore: string,
  ): KaspaUtxo[] {
    const utxos: KaspaUtxo[] = [];
    for (let i = 0; i < count; i++) {
      utxos.push(this.generateUtxo(amount, startBlockDaaScore));
      startBlockDaaScore = (parseInt(startBlockDaaScore) + 1).toString();
    }
    return utxos;
  }

  private static generateRandomTransactionId(): string {
    const randomBytes = crypto.getRandomValues(new Uint8Array(32));
    return Array.from(randomBytes)
      .map(b => b.toString(16).padStart(2, "0"))
      .join("");
  }

  private static generateRandomIndex(): number {
    return Math.floor(Math.random() * 1000);
  }

  private static generateRandomScriptPublicKey(): string {
    const randomBytes = crypto.getRandomValues(new Uint8Array(34));
    return Array.from(randomBytes)
      .map(b => b.toString(16).padStart(2, "0"))
      .join("");
  }
}

describe("2 outputs - no discard", () => {
  test("2/5 inputs, 2 outputs", () => {
    const utxos = KaspaUtxoGenerator.generateUtxoSet(5, BigNumber(1_0000_0000), "12345");
    const feeRate = 1;
    const isEcdsaRecipient = false;
    const selectedUtxos = selectUtxos(utxos, isEcdsaRecipient, BigNumber(1_5000_0000), feeRate);

    expect(utxos.length).toBe(5);
    // Selected 2 times 1_0000_0000 UTXO
    expect(selectedUtxos.utxos.length).toBe(2);
    expect(selectedUtxos.utxos[0].utxoEntry.blockDaaScore).toBe("12345");
    expect(selectedUtxos.utxos[1].utxoEntry.blockDaaScore).toBe("12346");

    // TX should have: 2 inputs and 2 outputs
    // compute mass = 3154
    // storage mass = 6668

    // fee only depends on compute mass
    expect(selectedUtxos.fee.toNumber()).toBe(3154);
    expect(selectedUtxos.changeAmount.toNumber()).toBe(2_0000_0000 - 1_5000_0000 - 3154);
  });

  test("1/5 inputs, 2 outputs", () => {
    const utxos = KaspaUtxoGenerator.generateUtxoSet(5, BigNumber(2_0000_0000), "12345");
    const isEcdsaRecipient = false;
    const feeRate = 1;
    const sendAmount = BigNumber(1_5000_0000);
    const selectedUtxos = selectUtxos(utxos, isEcdsaRecipient, sendAmount, feeRate);

    expect(selectedUtxos.utxos.length).toBe(1);
    expect(selectedUtxos.utxos[0].utxoEntry.blockDaaScore).toBe("12345");

    // TX should be: 1 in + 2 out
    // compute mass = 2036
    // storage mass = 21674
    expect(selectedUtxos.fee.toNumber()).toBe(2036);
    expect(selectedUtxos.changeAmount.toNumber()).toBe(2_0000_0000 - 1_5000_0000 - 2036);
  });

  it.each([1, 10, 20, 80, 5000])("5 inputs, 2 outputs, feeRate = %i", feeRate => {
    const utxos = KaspaUtxoGenerator.generateUtxoSet(15, BigNumber(1_0000_0000), "12345");
    const isEcdsaRecipient = false;
    const sendAmount = BigNumber(4_5000_0000);
    const selectedUtxos = selectUtxos(utxos, isEcdsaRecipient, sendAmount, feeRate);

    expect(selectedUtxos.utxos.length).toBe(5);
    // TX should be: 1 in + 2 out
    // compute mass = 1118 * 5 + 918 = 6508
    // storage mass = 0 ( 5 in and 2 out.. )
    expect(selectedUtxos.fee.toNumber()).toBe(6508 * feeRate);
    expect(selectedUtxos.changeAmount.toNumber()).toBe(5_0000_0000 - 4_5000_0000 - 6508 * feeRate);
  });

  test("5 inputs, 2 outputs, feerate = 8203 => not possible!", () => {
    const utxos = KaspaUtxoGenerator.generateUtxoSet(5, BigNumber(1_0000_0000), "12345");
    const feerate = 8203;

    expect(selectUtxos(utxos, false, BigNumber(4_5000_0000), feerate - 1)).toEqual({
      utxos,
      changeAmount: new BigNumber(0),
      fee: new BigNumber(50000000),
    });
    expect(() => selectUtxos(utxos, false, BigNumber(4_5000_0000), feerate)).toThrow(
      "UTXO total amount is not sufficient for sending amount 450000000",
    );
  });
});
describe("ECDSA mass", () => {
  it.each([1, 2, 5])("5 inputs, 2 outputs, feerate = %i, ECDSA", feeRate => {
    const utxos = KaspaUtxoGenerator.generateUtxoSet(10, BigNumber(1_0000_0000), "12345");
    const selectedUtxos = selectUtxos(utxos, true, BigNumber(4_5000_0000), feeRate);

    const expectedInputCnt = 5;
    const computeMass =
      TX_MASS_FOR_TWO_OUTPUTS + TX_MASS_PER_INPUT * expectedInputCnt + TX_MASS_FOR_ECDSA;
    const expectedFee = computeMass * feeRate;

    expect(selectedUtxos.utxos.length).toBe(expectedInputCnt);
    // TX should be: 1 in + 2 out
    // compute mass = 1118 * 5 + 918 + 11 (ECDSA) = 6508
    // storage mass = 0 ( 5 in and 2 out.. )

    expect(selectedUtxos.fee.toNumber()).toBe(expectedFee);
    expect(selectedUtxos.changeAmount.toNumber()).toBe(5_0000_0000 - 4_5000_0000 - expectedFee);
  });
  test("2/2 input, 2 outputs, feerate = 1, ECDSA", () => {
    const utxos = KaspaUtxoGenerator.generateUtxoSet(5, BigNumber(1_0000_0000), "12345");
    const selectedUtxos = selectUtxos(utxos, true, BigNumber(1_5000_0000), 1);

    expect(utxos.length).toBe(5);
    expect(selectedUtxos.utxos.length).toBe(2);
    // TX should be: 2 in + 2 out
    // compute mass = 3165 (ECDSA)
    // storage mass = 6668
    expect(selectedUtxos.fee.toNumber()).toBe(3165);
    expect(selectedUtxos.changeAmount.toNumber()).toBe(2_0000_0000 - 1_5000_0000 - 3165);
  });
});
describe("2 outputs - no discard", () => {});

describe("1 output with discard", () => {
  test("check sweetspot - discard up to 1530 sompis change", () => {
    const feeRate = 1;
    const utxos = KaspaUtxoGenerator.generateUtxoSet(6, BigNumber(1_0000_0000), "12345");
    const isEcdsaRecipient = false;
    const sendAmount = BigNumber(5_0000_0000 - 5 * 1118 - 918 - 1530);
    const selectedUtxos = selectUtxos(utxos, isEcdsaRecipient, sendAmount, feeRate);

    expect(selectedUtxos.utxos.length).toBe(5);
    expect(selectedUtxos.fee.toNumber()).toBe(5 * 1118 + 918 + 1530);
    expect(selectedUtxos.changeAmount.toNumber()).toBe(0);

    const selectedUtxos2 = selectUtxos(utxos, isEcdsaRecipient, sendAmount.minus(1), feeRate);
    expect(selectedUtxos2.utxos.length).toBe(6);
    expect(selectedUtxos2.fee.toNumber()).toBe(6 * 1118 + 918);
    expect(selectedUtxos2.changeAmount.toNumber()).toBe(100000413);
  });

  test("check sweetspot with feeRate", () => {
    const feeRate = 2;
    const utxos = KaspaUtxoGenerator.generateUtxoSet(6, BigNumber(1_0000_0000), "12345");
    const isEcdsaRecipient = false;
    const sendAmount = BigNumber(5_0000_0000 - (5 * 1118 + 506) * 2);
    const selectedUtxos = selectUtxos(utxos, isEcdsaRecipient, sendAmount, feeRate);

    expect(selectedUtxos.utxos.length).toBe(5);
    expect(selectedUtxos.fee.toNumber()).toBe((5 * 1118 + 506) * 2);
    expect(selectedUtxos.changeAmount.toNumber()).toBe(0);
  });

  test("6 inputs, 2 outputs, feerate = 7682 => don't discard change, pick one more UTXO", () => {
    const utxos = KaspaUtxoGenerator.generateUtxoSet(10, BigNumber(1_0000_0000), "12345");
    const feerate = 7682;
    const selectedUtxos = selectUtxos(utxos, false, BigNumber(4_5000_0000), feerate);
    // in this case the change has to be discarded, as it's only 5544 sompis
    // and the storage mass explodes to an inacceptable value of 180327402g
    expect(selectedUtxos.utxos.length).toBe(5);
    expect(selectedUtxos.fee.toNumber()).toBe(50000000);
    expect(selectedUtxos.changeAmount.toNumber()).toBe(0);
  });

  test("6 inputs, 2 outputs, feerate = 8203 => need 6 inputs now.!", () => {
    const utxos = KaspaUtxoGenerator.generateUtxoSet(6, BigNumber(1_0000_0000), "12345");
    const feerate = 8203;
    const selectedUtxos = selectUtxos(utxos, false, BigNumber(4_5000_0000), feerate);

    const expectedInputCnt = 6;
    const computeMass = TX_MASS_FOR_TWO_OUTPUTS + TX_MASS_PER_INPUT * expectedInputCnt;
    const expectedFee = computeMass * feerate;

    expect(selectedUtxos.utxos.length).toBe(expectedInputCnt);
    expect(selectedUtxos.fee.toNumber()).toBe(expectedFee);
    expect(selectedUtxos.changeAmount.toNumber()).toBe(1_5000_0000 - expectedFee);
  });
});

describe("1 output without discard", () => {
  test("send exact UTXO sum for all UTXOs with no change", () => {
    const utxos = KaspaUtxoGenerator.generateUtxoSet(5, BigNumber(1_0000_0000), "12345");
    const feerate = 1;
    const selectedUtxos = selectUtxos(
      utxos,
      false,
      BigNumber(5_0000_0000 - (5 * 1118 + 506)),
      feerate,
    );

    expect(selectedUtxos.utxos.length).toBe(5);
    expect(selectedUtxos.fee.toNumber()).toBe(5 * 1118 + 506);
    expect(selectedUtxos.changeAmount.toNumber()).toBe(0);
  });

  test("send exact UTXO sum for 2 UTXOs with no change", () => {
    const utxos = KaspaUtxoGenerator.generateUtxoSet(5, BigNumber(1_0000_0000), "12345");
    const feerate = 1;
    const selectedUtxos = selectUtxos(
      utxos,
      false,
      BigNumber(2_0000_0000 - (2 * 1118 + 506)),
      feerate,
    );

    expect(selectedUtxos.utxos.length).toBe(2);
    expect(selectedUtxos.fee.toNumber()).toBe(2 * 1118 + 506);
    expect(selectedUtxos.changeAmount.toNumber()).toBe(0);
  });

  test("should throw an error if balance is higher than the sum of 88 UTXO", () => {
    const utxos = KaspaUtxoGenerator.generateUtxoSet(100, BigNumber(1_0000_0000), "0");
    const feeRate = 1;
    const isEcdsaRecipient = false;

    expect(() => {
      selectUtxos(utxos, isEcdsaRecipient, BigNumber(99_0000_0000), feeRate);
    }).toThrow("UTXO total amount is not sufficient for sending amount 9900000000");
  });

  test("should be fine, if less than 88 UTXOs needed for a set of 100 UTXO", () => {
    const utxos = KaspaUtxoGenerator.generateUtxoSet(100, BigNumber(1_0000_0000), "0");
    const feeRate = 1;
    const isEcdsaRecipient = false;

    const selectedUtxos = selectUtxos(utxos, isEcdsaRecipient, BigNumber(80_0000_0000), feeRate);

    expect(selectedUtxos.utxos.length).toBe(81);
    expect(selectedUtxos.fee.toNumber()).toBe(81 * 1118 + 918);
    expect(selectedUtxos.changeAmount.toNumber()).toBe(1_0000_0000 - (81 * 1118 + 918));
  });

  test("should throw an error if discarded change exceeds maximum allowable discard value", () => {
    const utxos = KaspaUtxoGenerator.generateUtxoSet(10, BigNumber(1_0000_0000), "0");
    const feeRate = 1;
    const isEcdsaRecipient = false;

    expect(() => {
      selectUtxos(utxos, isEcdsaRecipient, BigNumber(1_0000), feeRate);
    }).toThrow(/Change \d+ Sompis is too high to be discarded./);
  });

  test("Send maximum amount for 88/100 UTXOs", () => {
    const utxos = KaspaUtxoGenerator.generateUtxoSet(100, BigNumber(1_0000_0000), "0");
    const feeRate = 1;
    const isEcdsaRecipient = false;

    const expectedFee = 88 * 1118 + 506;

    const maxAmount = BigNumber(88_0000_0000).minus(expectedFee);
    const selectedUtxos = selectUtxos(utxos, isEcdsaRecipient, maxAmount, feeRate);

    expect(selectedUtxos.utxos.length).toBe(88);
    expect(selectedUtxos.fee.toNumber()).toBe(expectedFee);
    expect(selectedUtxos.changeAmount.toNumber()).toBe(0);
  });

  test("should throw - UTXOs can't be determined to fulfill the specified amount", () => {
    mockCalcMaxSpendableAmount.mockReturnValue(BigNumber(1_2345_0000));
    const feeRate = 1;
    const isEcdsaRecipient = false;

    expect(() => {
      selectUtxos([], isEcdsaRecipient, BigNumber(1_0000), feeRate);
    }).toThrow("UTXOs can't be determined to fulfill the specified amount");
  });

  test("same blockdaascore, still working.", () => {
    // Generate more UTXOs than the allowed limit (88)
    const utxos = KaspaUtxoGenerator.generateUtxoSet(2, BigNumber(1_0000_0000), "0");
    const isEcdsaRecipient = false;

    utxos[1].utxoEntry.blockDaaScore = "0";

    expect(selectUtxos(utxos, isEcdsaRecipient, BigNumber(1_0000_0000)).utxos.length).toBe(2);
  });

  afterEach(() => {
    jest.restoreAllMocks();
    // Reset to actual implementation
    mockCalcMaxSpendableAmount.mockImplementation(
      jest.requireActual("../utxos/lib").calcMaxSpendableAmount,
    );
  });
});
