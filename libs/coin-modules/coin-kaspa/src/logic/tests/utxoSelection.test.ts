import { selectUtxos } from "../utxos/selection";
import { BigNumber } from "bignumber.js";
import { KaspaUtxo } from "../../types";
import expect from "expect";

const TX_MASS_PER_INPUT = 1118;
const TX_MASS_FOR_ONE_OUTPUT = 506;
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

describe("selectUtxos - check fee, change amount and discarding of dust change", () => {
  test("2 input, 2 outputs, feerate = 1", () => {
    const utxos = KaspaUtxoGenerator.generateUtxoSet(5, BigNumber(1_0000_0000), "12345");
    const selectedUtxos = selectUtxos(utxos, false, BigNumber(1_5000_0000), 1);

    // 2x 1_0000_0000 UTXO
    expect(utxos.length).toBe(5);

    expect(selectedUtxos.utxos.length).toBe(2);
    expect(selectedUtxos.utxos[0].utxoEntry.blockDaaScore).toBe("12345");
    expect(selectedUtxos.utxos[1].utxoEntry.blockDaaScore).toBe("12346");

    // TX should be: 2 in + 2 out
    // compute mass = 3154
    // storage mass = 6668
    expect(selectedUtxos.fee.toNumber()).toBe(3154);
    expect(selectedUtxos.changeAmount.toNumber()).toBe(2_0000_0000 - 1_5000_0000 - 3154);
  });
  test("2 input, 2 outputs, feerate = 1, ECDSA", () => {
    const utxos = KaspaUtxoGenerator.generateUtxoSet(5, BigNumber(1_0000_0000), "12345");
    const selectedUtxos = selectUtxos(utxos, true, BigNumber(1_5000_0000), 1);

    const expectedFee = TX_MASS_FOR_TWO_OUTPUTS + TX_MASS_PER_INPUT * 2 + TX_MASS_FOR_ECDSA;

    expect(utxos.length).toBe(5);
    expect(selectedUtxos.utxos.length).toBe(2);
    // TX should be: 2 in + 2 out
    // compute mass = 3165 (ECDSA)
    // storage mass = 6668
    expect(selectedUtxos.fee.toNumber()).toBe(3165);
    expect(selectedUtxos.changeAmount.toNumber()).toBe(2_0000_0000 - 1_5000_0000 - 3165);
  });
  test("1 input, 2 outputs, feerate = 1", () => {
    const utxos = KaspaUtxoGenerator.generateUtxoSet(5, BigNumber(2_0000_0000), "12345");
    const selectedUtxos = selectUtxos(utxos, false, BigNumber(1_5000_0000), 1);

    expect(selectedUtxos.utxos.length).toBe(1);
    expect(selectedUtxos.utxos[0].utxoEntry.blockDaaScore).toBe("12345");

    // TX should be: 1 in + 2 out
    // compute mass = 2036
    // storage mass = 21674
    expect(selectedUtxos.fee.toNumber()).toBe(2036);
    expect(selectedUtxos.changeAmount.toNumber()).toBe(2_0000_0000 - 1_5000_0000 - 2036);
  });
  test("5 inputs, 2 outputs, feerate = 1", () => {
    const utxos = KaspaUtxoGenerator.generateUtxoSet(10, BigNumber(1_0000_0000), "12345");
    const feerate = 1;
    const selectedUtxos = selectUtxos(utxos, false, BigNumber(4_5000_0000), feerate);

    const expectedInputCnt = 5;
    const computeMass = TX_MASS_FOR_TWO_OUTPUTS + TX_MASS_PER_INPUT * expectedInputCnt;
    const expectedFee = computeMass * feerate;

    expect(selectedUtxos.utxos.length).toBe(expectedInputCnt);
    // TX should be: 1 in + 2 out
    // compute mass = 1118 * 5 + 918 = 6508
    // storage mass = 0 ( 5 in and 2 out.. )
    expect(selectedUtxos.fee.toNumber()).toBe(expectedFee);
    expect(selectedUtxos.changeAmount.toNumber()).toBe(5_0000_0000 - 4_5000_0000 - expectedFee);
  });

  test("5 inputs, 2 outputs, feerate = 1, ECDSA", () => {
    const utxos = KaspaUtxoGenerator.generateUtxoSet(10, BigNumber(1_0000_0000), "12345");
    const feerate = 1;
    const selectedUtxos = selectUtxos(utxos, true, BigNumber(4_5000_0000), feerate);

    const expectedInputCnt = 5;
    const computeMass =
      TX_MASS_FOR_TWO_OUTPUTS + TX_MASS_PER_INPUT * expectedInputCnt + TX_MASS_FOR_ECDSA;
    const expectedFee = computeMass * feerate;

    expect(selectedUtxos.utxos.length).toBe(expectedInputCnt);
    // TX should be: 1 in + 2 out
    // compute mass = 1118 * 5 + 918 + 11 (ECDSA) = 6508
    // storage mass = 0 ( 5 in and 2 out.. )

    expect(selectedUtxos.fee.toNumber()).toBe(expectedFee);
    expect(selectedUtxos.changeAmount.toNumber()).toBe(5_0000_0000 - 4_5000_0000 - expectedFee);
  });

  test("5 inputs, 2 outputs, feerate = 5", () => {
    const utxos = KaspaUtxoGenerator.generateUtxoSet(5, BigNumber(1_0000_0000), "12345");
    const feerate = 5;
    const selectedUtxos = selectUtxos(utxos, false, BigNumber(4_5000_0000), feerate);

    const expectedInputCnt = 5;
    const computeMass = TX_MASS_FOR_TWO_OUTPUTS + TX_MASS_PER_INPUT * expectedInputCnt;
    const expectedFee = computeMass * feerate;

    expect(selectedUtxos.utxos.length).toBe(expectedInputCnt);
    // TX should be: 1 in + 2 out
    // compute mass = 1118 * 5 + 918 = 6508
    // storage mass = 0 ( 5 in and 2 out.. )
    expect(selectedUtxos.fee.toNumber()).toBe(expectedFee);
    expect(selectedUtxos.changeAmount.toNumber()).toBe(5_0000_0000 - 4_5000_0000 - expectedFee);
  });

  test("5 inputs, 2 outputs, feerate = 5000", () => {
    const utxos = KaspaUtxoGenerator.generateUtxoSet(6, BigNumber(1_0000_0000), "12345");
    const feerate = 5000;
    const selectedUtxos = selectUtxos(utxos, false, BigNumber(4_5000_0000), 5000);

    const expectedInputCnt = 5;
    const computeMass = TX_MASS_FOR_TWO_OUTPUTS + TX_MASS_PER_INPUT * expectedInputCnt;
    const expectedFee = computeMass * feerate;

    expect(selectedUtxos.utxos.length).toBe(expectedInputCnt);
    // TX should be: 1 in + 2 out
    // compute mass = 1118 * 5 + 918 = 6508
    // storage mass = 0 ( 5 in and 2 out.. )
    expect(selectedUtxos.fee.toNumber()).toBe(expectedFee);
    expect(selectedUtxos.changeAmount.toNumber()).toBe(5_0000_0000 - 4_5000_0000 - expectedFee);
  });

  test("5 inputs, 2 outputs, feerate = 7682 => discard change!", () => {
    const utxos = KaspaUtxoGenerator.generateUtxoSet(5, BigNumber(1_0000_0000), "12345");
    const feerate = 7682;
    const selectedUtxos = selectUtxos(utxos, false, BigNumber(4_5000_0000), feerate);
    // in this case the change has to be discarded, as it's only 5544 sompis
    // and the storage mass explodes to an inacceptable value of 180327402g
    expect(selectedUtxos.utxos.length).toBe(5);
    expect(selectedUtxos.fee.toNumber()).toBe(5000_0000);
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

  test("5 inputs, 2 outputs, feerate = 8203 => not possible!", () => {
    const utxos = KaspaUtxoGenerator.generateUtxoSet(5, BigNumber(1_0000_0000), "12345");
    const feerate = 8203;

    expect(() => selectUtxos(utxos, false, BigNumber(4_5000_0000), feerate)).toThrow(
      "UTXO total amount is not sufficient for sending amount 450000000",
    );
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

  test("send all", () => {
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

  test("send almost all", () => {
    const utxos = KaspaUtxoGenerator.generateUtxoSet(5, BigNumber(1_0000_0000), "12345");
    const feerate = 1;
    const selectedUtxos = selectUtxos(
      utxos,
      false,
      BigNumber(5_0000_0000 - (5 * 1118 + 506) - 2),
      feerate,
    );

    expect(selectedUtxos.utxos.length).toBe(5);
    expect(selectedUtxos.fee.toNumber()).toBe(5 * 1118 + 506 + 2);
    expect(selectedUtxos.changeAmount.toNumber()).toBe(0);
  });
});
