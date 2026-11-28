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
  // A USDT transfer owned by the address of private key 0x11…11, signed by that key with tronweb.
  const payment: EnergyRentUnsignedTransaction = {
    visible: false,
    txID: "c48d532e273e188b85d6d2e83cfc57e38f1982c1466d5a1d2a4d34dc61a20b4b",
    raw_data: {},
    raw_data_hex:
      "0a020ee522082e5fc67747a428af40f0e2ace4d3325aad01081f12a8010a31747970652e676f6f676c65617069732e636f6d2f70726f746f636f6c2e54726967676572536d617274436f6e747261637412730a154119e7e376e7c213b7e7e7e46cc70a5dd086daff2a121541a614f803b6fd780986a42c78ec9c7f77e6ded13c2243a9059cbb000000000000000000000000aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa000000000000000000000000000000000000000000000000000000000f424070fd9ca9e4d33290018087a70e",
  };
  const RS =
    "b012c72290538ab3e61c3c22fb3662f85f9c87f1ec4cc0d686b42dcf5fb48e580035b3c7d44563a1bd34c366769b3960e9da6695ee38702130297f7cdef693d3";
  // The same transaction signed by private key 0x22…22.
  const OTHER_KEY_SIGNATURE =
    "267b81f7c0b37f346dc223a5fb2b70b2bf69cc60fb80a5a2776f6b11e0a8b9bf350ce81efdeeb787e1bd93bee9d704e5dc19ac243a3ca205c84bc5d4b9d8e0a11b";
  const signedWith = (signature: string) => combine(payment.raw_data_hex, [signature]);

  it.each([
    ["v = 28, as tronweb signs", `${RS}1c`],
    ["v = 1, the 0/1 form", `${RS}01`],
  ])("attaches the owner's signature with %s, unchanged", (_label, signature) => {
    expect(buildSignedEnergyRentTransaction(payment, signedWith(signature))).toEqual({
      ...payment,
      signature: [signature],
    });
  });

  it.each([
    ["another key", OTHER_KEY_SIGNATURE],
    ["the other recovery id", `${RS}00`],
  ])("rejects a signature by %s", (_label, signature) => {
    expect(() => buildSignedEnergyRentTransaction(payment, signedWith(signature))).toThrow(
      expect.objectContaining({ name: "EnergyRentSignatureMismatch" }),
    );
  });

  it("checks the hash of the signed bytes, not the provider's txID", () => {
    const relabelled = { ...payment, txID: "ab".repeat(32) };

    expect(buildSignedEnergyRentTransaction(relabelled, signedWith(`${RS}1c`))).toMatchObject({
      signature: [`${RS}1c`],
    });
  });

  it("rejects a payment whose bytes carry no single owner", () => {
    const signature = `${RS}1c`;

    expect(() =>
      buildSignedEnergyRentTransaction(unsigned, combine(unsigned.raw_data_hex, [signature])),
    ).toThrow(expect.objectContaining({ name: "EnergyRentSignatureMismatch" }));
  });

  it.each([
    ["a 64-byte compact signature", RS],
    ["a trailing byte", `${RS}1c00`],
    ["an EIP-155 v", `${RS}24`],
    ["v = 2", `${RS}02`],
    ["non-hex characters", `${RS.slice(0, 126)}zz1c`],
  ])("rejects %s before recovering the signer", (_label, signature) => {
    expect(() => buildSignedEnergyRentTransaction(payment, signedWith(signature))).toThrow(
      expect.objectContaining({ name: "InvalidRawDataHex" }),
    );
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
