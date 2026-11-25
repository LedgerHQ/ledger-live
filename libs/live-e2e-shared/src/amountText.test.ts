import assert from "node:assert/strict";
import test from "node:test";
import { extractAmountText } from "./amountText";

test("reads the amount before the ticker", () => {
  assert.equal(extractAmountText("Amount send\n0.00560805 ETH", "ETH"), "0.00560805");
});

test("drops thousands separators and keeps every decimal", () => {
  assert.equal(
    extractAmountText("1,234,567.123456789012345678 SHIB", "SHIB"),
    "1234567.123456789012345678",
  );
});

test("accepts a no-break space before the ticker", () => {
  assert.equal(extractAmountText("15.012 USDT", "USDT"), "15.012");
});

test("escapes a ticker with regular expression characters", () => {
  assert.equal(extractAmountText("5 A.B", "A.B"), "5");
  assert.throws(() => extractAmountText("5 AxB", "A.B"), /No A\.B amount/);
});

test("throws when the ticker is missing", () => {
  assert.throws(() => extractAmountText("~9.5 USDC", "ETH"), /No ETH amount/);
});
