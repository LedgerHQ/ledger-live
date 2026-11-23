import assert from "node:assert/strict";
import test from "node:test";
import { expectDeviceAmount } from "./deviceAmount";

const screens = (label: string, amount: string, ticker: string) => [label, amount, ` ${ticker}`];

const check = (events: string[], label: string, ticker: string, amount: string) =>
  expectDeviceAmount({ events, label, expected: { ticker, amount } });

const swapScreens = [
  "swap ETH to USDC",
  "Send",
  "0.0056080531643439",
  "98 ETH",
  "Receive",
  "9.550731 USDC",
  "Fees",
];

test("reads an amount split across several screens", () => {
  check(swapScreens, "Send", "ETH", "0.00560805");
  check(swapScreens, "Receive", "USDC", "9.550731");
});

test("throws when the label or ticker is missing", () => {
  assert.throws(() => check(swapScreens, "Send", "BTC", "1"), /not found/);
});

test("accepts the amount truncated by the app, including digits that would round up", () => {
  const events = screens("Send", "0.005608116065570093", "ETH");
  check(events, "Send", "ETH", "0.00560811");
});

test("rejects a different sent amount", () => {
  assert.throws(() => check(swapScreens, "Send", "ETH", "0.00570805"), /differs/);
});

test("handles a tiny 8-decimal BTC amount", () => {
  const btc = screens("Send", "0.00010000", "BTC");
  check(btc, "Send", "BTC", "0.0001");
  assert.throws(() => check(btc, "Send", "BTC", "0.0002"), /differs/);
});

test("handles a huge 18-decimal amount beyond double precision", () => {
  const amount = "1234567890.123456789012345678";
  const events = screens("Send", amount, "SHIB");
  check(events, "Send", "SHIB", amount);
  assert.throws(() => check(events, "Send", "SHIB", "1234567890.123456789012345679"), /differs/);
});

test("handles an integer amount without decimals", () => {
  check(screens("Send", "66", "DOGE"), "Send", "DOGE", "66");
});
