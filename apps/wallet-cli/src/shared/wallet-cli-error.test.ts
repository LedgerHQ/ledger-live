import { describe, expect, it } from "bun:test";
import { DEVICE_EXIT_CODES, DEVICE_STATE_RETRYABLE } from "../device/device-state";
import {
  USAGE_EXIT_CODE,
  WALLET_CLI_ERROR_DEFAULTS,
  WalletCliError,
  type WalletCliErrorCode,
} from "./wallet-cli-error";

describe("WALLET_CLI_ERROR_DEFAULTS", () => {
  it("maps usage codes to exit 64 and not retryable", () => {
    const usageCodes: WalletCliErrorCode[] = [
      "unknown_flag",
      "invalid_flag_value",
      "missing_required_flag",
      "unknown_command",
      "invalid_transport",
      "device_ambiguous",
    ];
    for (const code of usageCodes) {
      expect(WALLET_CLI_ERROR_DEFAULTS[code]).toEqual({
        exitCode: USAGE_EXIT_CODE,
        retryable: false,
      });
    }
  });

  it("maps device codes to the device-state taxonomy verbatim", () => {
    expect(WALLET_CLI_ERROR_DEFAULTS.rejected.exitCode).toBe(DEVICE_EXIT_CODES.rejected);
    expect(WALLET_CLI_ERROR_DEFAULTS.disconnected.exitCode).toBe(DEVICE_EXIT_CODES.disconnected);
    expect(WALLET_CLI_ERROR_DEFAULTS.wrong_app.exitCode).toBe(DEVICE_EXIT_CODES.wrong_app);
    expect(WALLET_CLI_ERROR_DEFAULTS.app_not_installed.exitCode).toBe(
      DEVICE_EXIT_CODES.app_not_installed,
    );
    expect(WALLET_CLI_ERROR_DEFAULTS.timeout.exitCode).toBe(DEVICE_EXIT_CODES.timeout);
    expect(WALLET_CLI_ERROR_DEFAULTS.locked.exitCode).toBe(DEVICE_EXIT_CODES.locked);
    for (const code of Object.keys(DEVICE_STATE_RETRYABLE) as Array<
      keyof typeof DEVICE_STATE_RETRYABLE
    >) {
      expect(WALLET_CLI_ERROR_DEFAULTS[code].retryable).toBe(DEVICE_STATE_RETRYABLE[code]);
    }
  });

  it("maps device_not_found like disconnected: exit 3, retryable", () => {
    expect(WALLET_CLI_ERROR_DEFAULTS.device_not_found).toEqual({
      exitCode: DEVICE_EXIT_CODES.disconnected,
      retryable: true,
    });
  });

  it("maps resolution codes to exit 1 and not retryable", () => {
    const resolutionCodes: WalletCliErrorCode[] = [
      "account_not_found",
      "raw_descriptor_rejected",
      "session_corrupt",
      "swap_quotes_unavailable",
    ];
    for (const code of resolutionCodes) {
      expect(WALLET_CLI_ERROR_DEFAULTS[code]).toEqual({
        exitCode: DEVICE_EXIT_CODES.generic,
        retryable: false,
      });
    }
  });
});

describe("WalletCliError", () => {
  it("derives exitCode and retryable from its code and carries hint/details/cause", () => {
    const cause = new Error("underlying");
    const err = new WalletCliError("session_corrupt", "Invalid session file at /tmp/x.yaml.", {
      hint: "Run `wallet-cli session reset` to clear it.",
      details: { path: "/tmp/x.yaml" },
      cause,
    });
    expect(err).toBeInstanceOf(Error);
    expect(err.name).toBe("WalletCliError");
    expect(err.code).toBe("session_corrupt");
    expect(err.exitCode).toBe(1);
    expect(err.retryable).toBe(false);
    expect(err.hint).toBe("Run `wallet-cli session reset` to clear it.");
    expect(err.details).toEqual({ path: "/tmp/x.yaml" });
    expect(err.cause).toBe(cause);
  });

  it("leaves hint and details undefined when not provided", () => {
    const err = new WalletCliError("unknown_command", "Unknown command: blances.");
    expect(err.exitCode).toBe(USAGE_EXIT_CODE);
    expect(err.retryable).toBe(false);
    expect(err.hint).toBeUndefined();
    expect(err.details).toBeUndefined();
  });
});
