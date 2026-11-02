import assert from "node:assert/strict";
import test from "node:test";
import { describeSwapInitFailure, type SwapInitLogEntry } from "./swapInitError";

const request: SwapInitLogEntry = {
  timestamp: "2026-10-26T14:25:16.250Z",
  level: "log",
  text: `%c[WindowMessage]%c sending message (ElectronWebview) ${JSON.stringify({
    id: "1",
    jsonrpc: "2.0",
    method: "custom.exchange.swap",
    params: { provider: "moonpay_trade" },
  })}`,
};

const errorResponse = (name: string, message: string): SwapInitLogEntry => ({
  timestamp: "2026-10-26T14:25:17.784Z",
  level: "log",
  text: `[WindowMessage] received message ${JSON.stringify({
    jsonrpc: "2.0",
    id: "1",
    error: {
      code: -32000,
      message: "unexpected server error",
      data: {
        code: "UNKNOWN_ERROR",
        message: "an unhandled error was thrown",
        data: { name, message },
      },
    },
  })}`,
});

test("the swap request alone is not a failure", () => {
  assert.equal(describeSwapInitFailure([request]), null);
});

test("names the payload error the swap request got back", () => {
  const failure = describeSwapInitFailure([
    request,
    errorResponse("PayloadStepError", "moonpay_trade error : failed to get quote"),
  ]);

  assert.equal(
    failure,
    "swap-init failed at PAYLOAD (Backend Swap Payload Retrieval): " +
      "PayloadStepError: moonpay_trade error : failed to get quote",
  );
});

test("names the device step of a complete-exchange error", () => {
  const failure = describeSwapInitFailure([
    request,
    errorResponse("CompleteExchangeError", "NotEnoughBalance"),
  ]);

  assert.equal(
    failure,
    "swap-init failed at device Exchange app (INIT): CompleteExchangeError: NotEnoughBalance",
  );
});

test("falls back to the log line when it carries no JSON", () => {
  const failure = describeSwapInitFailure([
    { level: "warning", text: "deserializing an unknown class 'PayloadStepError'" },
  ]);

  assert.equal(
    failure,
    "swap-init failed at PAYLOAD (Backend Swap Payload Retrieval): " +
      "deserializing an unknown class 'PayloadStepError'",
  );
});
