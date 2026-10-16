import assert from "node:assert/strict";
import test from "node:test";
import {
  base58ToHex,
  encodeRentPaymentRawData,
  hexToBase58,
  signedTransactionRawDataHex,
  tronTxId,
} from "./txA";

// A real Tronify rent payment broadcast on 2026-06-05 (coin-tron energyRent/index.test.ts), and the
// same payment re-encoded with a "hi" memo.
const JUNE_PAYMENT_HEX =
  "0a028ed022087280df3dd121c50c40b0b4cfd1e9335aae01081f12a9010a31747970652e676f6f676c65617069732e636f6d2f70726f746f636f6c2e54726967676572536d617274436f6e747261637412740a1541f71b647cb5b87f7393217111d80a909c2f7e1650121541a614f803b6fd780986a42c78ec9c7f77e6ded13c2244a9059cbb00000000000000000000000029228e5d382b7a2c2a0dbc05e6d6507f4dbb3bbe000000000000000000000000000000000000000000000000000000000032c56270b092bac0e933900180c2d72f";
const JUNE_PAYMENT_TX_ID = "26eea5f6072fdd5024596e2cbf9ea60653b996b813ab314eb8b66b44402caf80";
const JUNE_PAYMENT_WITH_MEMO_HEX =
  "0a028ed022087280df3dd121c50c40b0b4cfd1e933520268695aae01081f12a9010a31747970652e676f6f676c65617069732e636f6d2f70726f746f636f6c2e54726967676572536d617274436f6e747261637412740a1541f71b647cb5b87f7393217111d80a909c2f7e1650121541a614f803b6fd780986a42c78ec9c7f77e6ded13c2244a9059cbb00000000000000000000000029228e5d382b7a2c2a0dbc05e6d6507f4dbb3bbe000000000000000000000000000000000000000000000000000000000032c56270b092bac0e933900180c2d72f";

// Decoded once from JUNE_PAYMENT_HEX with coin-tron's decodeTransaction.
const JUNE_PAYMENT = {
  ownerHex: "41f71b647cb5b87f7393217111d80a909c2f7e1650",
  payeeHex: "4129228e5d382b7a2c2a0dbc05e6d6507f4dbb3bbe",
  amountBaseUnits: 3_327_330n,
  refBlockBytes: "8ed0",
  refBlockHash: "7280df3dd121c50c",
  expiration: 1_780_703_550_000,
  timestamp: 1_780_667_550_000,
  feeLimit: 100_000_000,
};

test("re-encodes the June Tronify payment byte for byte", () => {
  const rawDataHex = encodeRentPaymentRawData(JUNE_PAYMENT);

  assert.equal(rawDataHex, JUNE_PAYMENT_HEX);
  assert.equal(tronTxId(rawDataHex), JUNE_PAYMENT_TX_ID);
});

test("puts a memo in raw_data field 10", () => {
  assert.equal(
    encodeRentPaymentRawData({ ...JUNE_PAYMENT, memo: "hi" }),
    JUNE_PAYMENT_WITH_MEMO_HEX,
  );
});

test("puts a permission id in the contract's field 5", () => {
  const contractStart = JUNE_PAYMENT_HEX.indexOf("5aae01");
  const contractEnd = contractStart + 6 + 0xae * 2;
  const expected =
    JUNE_PAYMENT_HEX.slice(0, contractStart) +
    "5ab001" +
    JUNE_PAYMENT_HEX.slice(contractStart + 6, contractEnd) +
    "2802" +
    JUNE_PAYMENT_HEX.slice(contractEnd);

  assert.equal(encodeRentPaymentRawData({ ...JUNE_PAYMENT, permissionId: 2 }), expected);
});

test("converts TRON addresses between base58check and hex", () => {
  assert.equal(base58ToHex("TYVnihygBiy6ZY4vYNzAcK9yMvAmYPhuVq"), JUNE_PAYMENT.ownerHex);
  assert.equal(base58ToHex("TDii6vao7xyWg2rKPbCPWVRpSmne8xcqYx"), JUNE_PAYMENT.payeeHex);
  assert.equal(hexToBase58(JUNE_PAYMENT.payeeHex), "TDii6vao7xyWg2rKPbCPWVRpSmne8xcqYx");
});

test("rejects a base58 address with a bad checksum", () => {
  assert.throws(() => base58ToHex("TDii6vao7xyWg2rKPbCPWVRpSmne8xcqYy"), /checksum/);
});

test("reads raw_data back out of a signed transaction", () => {
  // raw_data is 211 bytes long: varint d3 01.
  const signedHex = `0ad301${JUNE_PAYMENT_HEX}1241${"ab".repeat(65)}`;

  assert.equal(signedTransactionRawDataHex(signedHex), JUNE_PAYMENT_HEX);
});
