import assert from "node:assert/strict";
import test from "node:test";
import { extractAmountText } from "./amountText";

test("reads the amount before the ticker", () => {
  assert.equal(
    extractAmountText({ text: "Amount send\n0.00560805 ETH", ticker: "ETH" }),
    "0.00560805",
  );
});

test("drops thousands separators and keeps every decimal", () => {
  assert.equal(
    extractAmountText({ text: "1,234,567.123456789012345678 SHIB", ticker: "SHIB" }),
    "1234567.123456789012345678",
  );
});

test("accepts a no-break space before the ticker", () => {
  assert.equal(extractAmountText({ text: "15.012 USDT", ticker: "USDT" }), "15.012");
});

test("escapes a ticker with regular expression characters", () => {
  assert.equal(extractAmountText({ text: "5 A.B", ticker: "A.B" }), "5");
  assert.throws(() => extractAmountText({ text: "5 AxB", ticker: "A.B" }), /No A\.B amount/);
});

test("throws when the ticker is missing", () => {
  assert.throws(() => extractAmountText({ text: "~9.5 USDC", ticker: "ETH" }), /No ETH amount/);
});
