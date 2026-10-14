import BigNumber from "bignumber.js";
import { combine } from "../combine";
import { TronifyApiError } from "../../types/errors";
import {
  buildSignedEnergyRentTransaction,
  getEnergyRentSignaturePayload,
  rentPayment,
  reservationDedupKey,
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

describe("reservationDedupKey", () => {
  it.each([["a1b2c3d4e5f6"], ["a".repeat(63) + "b"]])(
    "is finite, positive and non-integer for %s",
    txId => {
      const key = new BigNumber(reservationDedupKey(txId));
      expect(key.isFinite()).toBe(true);
      expect(key.isGreaterThan(0)).toBe(true);
      expect(key.isInteger()).toBe(false);
    },
  );

  it("is deterministic per tx id and distinct across ids", () => {
    expect(reservationDedupKey("a1b2c3d4e5f6")).toBe(reservationDedupKey("a1b2c3d4e5f6"));
    expect(reservationDedupKey("a1b2c3d4e5f6")).not.toBe(reservationDedupKey("f6e5d4c3b2a1"));
  });
});

describe("rentPayment", () => {
  const orderPaying = (payCoinAmt: string, payCoinCode = "USDT"): EnergyRentOrder => ({
    orderId: "o1",
    transaction: unsigned,
    payCoinCode,
    payCoinAmt,
  });

  it("reserves the USDT rent in base units against the USDT asset", () => {
    expect(rentPayment(orderPaying("3.124527"))).toEqual({
      asset: {
        type: "trc20",
        assetReference: "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t",
        name: "Tether USD",
        unit: { name: "USDT", code: "USDT", magnitude: 6 },
      },
      amount: 3_124_527n,
    });
  });

  it("rounds up a sub-unit amount so the reservation never under-locks", () => {
    expect(rentPayment(orderPaying("3.1245271")).amount).toBe(3_124_528n);
  });

  it("accepts a lower-case usdt code", () => {
    expect(rentPayment(orderPaying("1", "usdt")).amount).toBe(1_000_000n);
  });

  it.each([
    ["a TRX-priced order", orderPaying("3.2", "TRX")],
    ["a zero amount", orderPaying("0")],
    ["a non-numeric amount", orderPaying("abc")],
  ])("throws on %s", (_label, order) => {
    expect(() => rentPayment(order)).toThrow(TronifyApiError);
  });
});
