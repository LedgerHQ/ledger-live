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
  check(swapScreens, "Receive", "USDC", "9.55073");
});

test("throws when the label or ticker is missing", () => {
  assert.throws(() => check(swapScreens, "Send", "BTC", "1"), /not found/);
});

test("accepts the amount truncated by the app, including digits that would round up", () => {
  const events = screens("Send", "0.005608116065570093", "ETH");
  check(events, "Send", "ETH", "0.00560811");
});

test("accepts a trimmed trailing zero of the app format", () => {
  check(screens("Send", "15.012054", "USDT"), "Send", "USDT", "15.012");
});

test("rejects a device amount that only matches when the app decimals are guessed", () => {
  assert.throws(() => check(screens("Send", "0.029", "ETH"), "Send", "ETH", "0.02"), /reads/);
});

test("rejects a device amount below the amount the app shows", () => {
  const events = screens("Send", "0.005608109999999999", "ETH");
  assert.throws(() => check(events, "Send", "ETH", "0.00560811"), /reads/);
});

test("rejects a different sent amount", () => {
  assert.throws(() => check(swapScreens, "Send", "ETH", "0.00570805"), /reads/);
});

test("handles a tiny 8-decimal BTC amount", () => {
  const btc = screens("Send", "0.00010000", "BTC");
  check(btc, "Send", "BTC", "0.0001");
  assert.throws(() => check(btc, "Send", "BTC", "0.0002"), /reads/);
});

test("handles an 18-decimal amount without floating point loss", () => {
  const events = screens("Send", "0.123456789012345678", "ETH");
  check(events, "Send", "ETH", "0.123456");
  assert.throws(() => check(events, "Send", "ETH", "0.123457"), /reads/);
});

test("handles a huge amount shown without decimals", () => {
  const events = screens("Send", "1234567890.123456789012345678", "SHIB");
  check(events, "Send", "SHIB", "1234567890");
  assert.throws(() => check(events, "Send", "SHIB", "1234567891"), /reads/);
});

test("handles an integer amount without decimals", () => {
  check(screens("Send", "66", "DOGE"), "Send", "DOGE", "66");
});
