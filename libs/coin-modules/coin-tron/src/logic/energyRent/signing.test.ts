import { combine } from "../combine";
import {
  buildSignedEnergyRentTransaction,
  getEnergyRentSignaturePayload,
  nativeRentAmount,
} from "./signing";
import type { EnergyRentOrder, EnergyRentUnsignedTransaction } from "./types";

const unsigned: EnergyRentUnsignedTransaction = {
  visible: false,
  txID: "abc123",
  raw_data: {},
  raw_data_hex: "0a020ee5",
};

describe("getEnergyRentSignaturePayload", () => {
  it("exposes the signable hex and the payment id", () => {
    expect(getEnergyRentSignaturePayload(unsigned)).toEqual({
      toSign: "0a020ee5",
      paymentTxId: "abc123",
    });
  });
});

describe("buildSignedEnergyRentTransaction", () => {
  it("rebuilds the signed payload from the device's combined signature", () => {
    const signature = "0B7E480C202D77F02E84C4E86A4CEF2D44623E670F455558C6FA8F09F5715E66";
    const combined = combine(unsigned.raw_data_hex, [signature]);

    expect(buildSignedEnergyRentTransaction(unsigned, combined)).toEqual({
      ...unsigned,
      signature: [signature],
    });
  });
});

describe("nativeRentAmount", () => {
  it("converts the TRX pay amount to smallest-unit sun", () => {
    const order: EnergyRentOrder = {
      orderId: "o1",
      transaction: unsigned,
      payCoinCode: "TRX",
      payCoinAmt: "3.124527",
    };

    expect(nativeRentAmount(order)).toBe(3_124_527n);
  });

  it("rounds up a sub-sun pay amount so the reservation never under-locks", () => {
    const order: EnergyRentOrder = {
      orderId: "o1",
      transaction: unsigned,
      payCoinCode: "TRX",
      // 7 dp — the 0.0000001 TRX tail is below one sun and must round the reservation up, not down.
      payCoinAmt: "3.1245271",
    };

    expect(nativeRentAmount(order)).toBe(3_124_528n);
  });
});
