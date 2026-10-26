import { toBroadcastFailureLog, toBroadcastLogEvent } from "./broadcastLog";
import type { ErrorLogEvent } from "./useBroadcast";

const common = {
  appVersion: "1.0.0",
  currencyId: "ethereum",
  family: "evm",
  isTestnet: false,
  isSendMax: false,
  source: { type: "coin-module" as const, name: "ledger-live-desktop" },
};

describe("toBroadcastLogEvent", () => {
  it("drops attributes outside the allowlist", () => {
    const event = {
      status: "success" as const,
      ...common,
      txPayload: { signature: "0xsigned" },
    };

    const logged = toBroadcastLogEvent(event);

    expect(logged).toEqual({ status: "success", ...common });
    expect(logged).not.toHaveProperty("txPayload");
  });
});

describe("toBroadcastFailureLog", () => {
  const signedTx = "0x02f8b20181a0843b9aca00850df8475800830186a094";

  function failure(error: Error): ErrorLogEvent {
    return { status: "failure", error, ...common };
  }

  it("sanitizes the message and the stack header, and keeps the frames", () => {
    const error = new Error(`rejected tx ${signedTx}`);
    error.stack = `Error: rejected tx ${signedTx}\n    at broadcast (bridge.js:1:1)`;

    const log = toBroadcastFailureLog(failure(error));

    expect(log.error.name).toBe("Error");
    expect(log.error.message).toBe("rejected tx [id]");
    expect(log.error.stack).toBe("Error: rejected tx [id]\n    at broadcast (bridge.js:1:1)");
  });

  it("keeps no line of a multiline message in the stack", () => {
    const address = "0x71C7656EC7ab88b098defB751B7401B5f6d8976F";
    const error = new Error(`rejected\n    at sender ${address}`);
    error.stack = `Error: rejected\n    at sender ${address}\n    at broadcast (bridge.js:1:1)`;

    const log = toBroadcastFailureLog(failure(error));

    expect(log.error.message).toBe("rejected\n    at sender [id]");
    expect(log.error.stack).toBe(
      "Error: rejected\n    at sender [id]\n    at broadcast (bridge.js:1:1)",
    );
  });

  it("keeps no frame when the stack header does not quote the message", () => {
    const error = new Error("failed");
    error.stack = `Error: rejected tx ${signedTx}\n    at broadcast (bridge.js:1:1)`;

    expect(toBroadcastFailureLog(failure(error)).error.stack).toBe("Error: failed");
  });

  it("keeps flat error properties sanitized and drops nested ones", () => {
    const error = Object.assign(new Error("failed"), {
      code: "ERR_REJECTED",
      transactionId: 0,
      retryable: false,
      payload: signedTx,
      transaction: { from: "0xabc", data: signedTx },
    });

    expect(toBroadcastFailureLog(failure(error)).errorContext).toEqual({
      code: "ERR_REJECTED",
      transactionId: 0,
      retryable: false,
      payload: "[id]",
    });
  });

  it("keeps only allowlisted event attributes", () => {
    const event = { ...failure(new Error("failed")), txPayload: { signature: signedTx } };

    expect(toBroadcastFailureLog(event).event).toEqual({ status: "failure", ...common });
  });
});
