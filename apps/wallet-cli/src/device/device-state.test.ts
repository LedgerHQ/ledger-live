import { describe, expect, it } from "bun:test";
import {
  DEVICE_EXIT_CODES,
  type DeviceState,
  isTerminalDeviceState,
  renderDeviceState,
} from "./device-state";

describe("renderDeviceState", () => {
  it("renders disconnected with the [✖] glyph and exit code 3", () => {
    const { glyph, message, exitCode } = renderDeviceState({ code: "disconnected" });
    expect(glyph).toBe("[✖]");
    expect(message).toBe("Ledger not detected. Plug in, unlock, retry.");
    expect(exitCode).toBe(DEVICE_EXIT_CODES.disconnected);
  });

  it("renders wrong_app without found-app", () => {
    const { glyph, message, exitCode } = renderDeviceState({
      code: "wrong_app",
      expected: "Ethereum",
    });
    expect(glyph).toBe("[✖]");
    expect(message).toBe("Wrong app. Open Ethereum.");
    expect(exitCode).toBe(DEVICE_EXIT_CODES.wrong_app);
  });

  it("renders wrong_app with found-app in parentheses", () => {
    const { message } = renderDeviceState({
      code: "wrong_app",
      expected: "Ethereum",
      found: "Bitcoin",
    });
    expect(message).toBe("Wrong app (found: Bitcoin). Open Ethereum.");
  });

  it("renders awaiting_approval.sign with [⧖] glyph and exit 0", () => {
    const { glyph, message, exitCode } = renderDeviceState({
      code: "awaiting_approval",
      reason: "sign",
    });
    expect(glyph).toBe("[⧖]");
    expect(message).toBe("Review on device. Approve or reject.");
    expect(exitCode).toBe(DEVICE_EXIT_CODES.success);
  });

  it("renders awaiting_approval.verify_address", () => {
    const { message } = renderDeviceState({ code: "awaiting_approval", reason: "verify_address" });
    expect(message).toMatch(/Review address on device/);
  });

  it("renders awaiting_approval.open_app", () => {
    const { message } = renderDeviceState({ code: "awaiting_approval", reason: "open_app" });
    expect(message).toMatch(/Confirm on device to open the app/);
  });

  it("renders awaiting_approval.unlock", () => {
    const { message } = renderDeviceState({ code: "awaiting_approval", reason: "unlock" });
    expect(message).toMatch(/Ledger is locked.*PIN/);
  });

  it("renders rejected.sign with [✖] and exit code 2", () => {
    const { glyph, message, exitCode } = renderDeviceState({
      code: "rejected",
      context: "sign",
    });
    expect(glyph).toBe("[✖]");
    expect(message).toBe("Rejected on device. No action taken.");
    expect(exitCode).toBe(DEVICE_EXIT_CODES.rejected);
  });

  it("renders rejected.verify_address", () => {
    const { message } = renderDeviceState({ code: "rejected", context: "verify_address" });
    expect(message).toMatch(/Address not confirmed/);
  });

  it("renders rejected.open_app", () => {
    const { message } = renderDeviceState({ code: "rejected", context: "open_app" });
    expect(message).toMatch(/App was not opened/);
  });

  it("renders exchange_app_needed with [ℹ] glyph and exit 0", () => {
    const { glyph, message, exitCode } = renderDeviceState({ code: "exchange_app_needed" });
    expect(glyph).toBe("[ℹ]");
    expect(message).toBe("Open Exchange app.");
    expect(exitCode).toBe(DEVICE_EXIT_CODES.success);
  });

  it("renders locked with [✖] and exit 6", () => {
    const { glyph, message, exitCode } = renderDeviceState({ code: "locked" });
    expect(glyph).toBe("[✖]");
    expect(message).toMatch(/locked/i);
    expect(exitCode).toBe(DEVICE_EXIT_CODES.timeout);
  });

  it("renders app_not_installed with the app name and exit 5", () => {
    const { glyph, message, exitCode } = renderDeviceState({
      code: "app_not_installed",
      appName: "Ethereum",
    });
    expect(glyph).toBe("[✖]");
    expect(message).toMatch(/Ethereum.*not installed/);
    expect(exitCode).toBe(DEVICE_EXIT_CODES.app_not_installed);
  });

  it("renders timeout with exit 6", () => {
    const { exitCode, message } = renderDeviceState({ code: "timeout" });
    expect(message).toMatch(/Timed out/);
    expect(exitCode).toBe(DEVICE_EXIT_CODES.timeout);
  });

  it("renders unknown from an Error cause using its message", () => {
    const { message, exitCode } = renderDeviceState({
      code: "unknown",
      cause: new Error("boom"),
    });
    expect(message).toBe("boom");
    expect(exitCode).toBe(DEVICE_EXIT_CODES.generic);
  });

  it("renders unknown from a string cause", () => {
    const { message } = renderDeviceState({ code: "unknown", cause: "oops" });
    expect(message).toBe("oops");
  });

  it("renders unknown fallback for null cause", () => {
    const { message } = renderDeviceState({ code: "unknown", cause: null });
    expect(message).toBe("An unknown error occurred talking to the Ledger.");
  });
});

describe("isTerminalDeviceState", () => {
  const terminalCodes: Array<[string, DeviceState]> = [
    ["disconnected", { code: "disconnected" }],
    ['wrong_app (expected "Ethereum")', { code: "wrong_app", expected: "Ethereum" }],
    ["rejected (context: sign)", { code: "rejected", context: "sign" }],
    ["locked", { code: "locked" }],
    ['app_not_installed ("Ethereum")', { code: "app_not_installed", appName: "Ethereum" }],
    ["timeout", { code: "timeout" }],
    ["unknown (with Error cause)", { code: "unknown", cause: new Error("x") }],
  ];
  const intermediateCodes: Array<[string, DeviceState]> = [
    ["awaiting_approval (sign)", { code: "awaiting_approval", reason: "sign" }],
    ["exchange_app_needed", { code: "exchange_app_needed" }],
  ];

  it.each(terminalCodes)("is terminal for %s", (_, state) => {
    expect(isTerminalDeviceState(state)).toBe(true);
  });

  it.each(intermediateCodes)("is non-terminal for %s", (_, state) => {
    expect(isTerminalDeviceState(state)).toBe(false);
  });
});
