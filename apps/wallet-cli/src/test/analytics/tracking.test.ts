import { describe, expect, it, mock } from "bun:test";
import { WalletCliDeviceError } from "../../device/wallet-cli-device-error";
import { redactAddresses, trackErrorInfo, withTracking } from "../../analytics/tracking";

const EVM_ADDRESS = "0x1111111111111111111111111111111111111111";
// A representative Solana base58 public key (32 bytes -> 44 base58 chars).
const SOLANA_ADDRESS = "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM";

function rejection(): WalletCliDeviceError {
  return new WalletCliDeviceError({ code: "rejected", context: "sign" });
}

describe("redactAddresses", () => {
  it("strips EVM addresses so they never reach analytics", () => {
    const msg = `Refusing to sign deposit: backend transaction target ${EVM_ADDRESS} does not match allowlisted target ${EVM_ADDRESS}.`;
    const redacted = redactAddresses(msg);
    expect(redacted).not.toContain(EVM_ADDRESS);
    expect(redacted).toContain("<address>");
  });

  it("strips Solana base58 addresses", () => {
    const redacted = redactAddresses(`stake account ${SOLANA_ADDRESS} not found`);
    expect(redacted).not.toContain(SOLANA_ADDRESS);
    expect(redacted).toContain("<address>");
  });

  it("leaves address-free messages untouched", () => {
    expect(redactAddresses("vault usdc-vault is not currently depositable")).toBe(
      "vault usdc-vault is not currently depositable",
    );
  });
});

describe("trackErrorInfo", () => {
  it("uses the device state code for a WalletCliDeviceError", () => {
    expect(trackErrorInfo(rejection()).errorCode).toBe("rejected");
  });

  it("uses the error name for a generic Error and redacts its message", () => {
    class VaultError extends Error {
      constructor() {
        super(`built for wallet ${EVM_ADDRESS}`);
        this.name = "VaultError";
      }
    }
    const info = trackErrorInfo(new VaultError());
    expect(info.errorCode).toBe("VaultError");
    expect(info.errorMessage).not.toContain(EVM_ADDRESS);
  });

  it('falls back to "unknown" for a non-Error throw', () => {
    expect(trackErrorInfo("boom")).toEqual({ errorCode: "unknown", errorMessage: "boom" });
  });
});

describe("withTracking", () => {
  it("fires onStart then onSuccess and returns the result on the happy path", async () => {
    const events: string[] = [];
    const result = await withTracking(
      {
        onStart: () => events.push("start"),
        onSuccess: r => events.push(`success:${r}`),
        onRejected: () => events.push("rejected"),
        onFailed: () => events.push("failed"),
      },
      async () => "value",
    );

    expect(result).toBe("value");
    expect(events).toEqual(["start", "success:value"]);
  });

  it("fires onRejected (and NOT onFailed) for a device rejection, then rethrows", async () => {
    const events: string[] = [];
    const promise = withTracking(
      {
        onStart: () => events.push("start"),
        onRejected: () => events.push("rejected"),
        onFailed: () => events.push("failed"),
      },
      async () => {
        throw rejection();
      },
    );

    await expect(promise).rejects.toBeInstanceOf(WalletCliDeviceError);
    // Rejection is its own terminal event: it must not also inflate the failure funnel.
    expect(events).toEqual(["start", "rejected"]);
  });

  it("fires onFailed for a non-rejection error, then rethrows", async () => {
    const failed: Array<{ errorCode: string; errorMessage: string }> = [];
    const promise = withTracking(
      {
        onRejected: () => failed.push({ errorCode: "should-not-happen", errorMessage: "" }),
        onFailed: (_e, info) => failed.push(info),
      },
      async () => {
        throw new Error(`built for wallet ${EVM_ADDRESS}`);
      },
    );

    await expect(promise).rejects.toThrow();
    expect(failed).toHaveLength(1);
    expect(failed[0].errorCode).toBe("Error");
    expect(failed[0].errorMessage).not.toContain(EVM_ADDRESS);
  });

  it("routes a device rejection to onFailed when no onRejected handler is provided", async () => {
    const events: string[] = [];
    const promise = withTracking(
      { onFailed: (_e, info) => events.push(`failed:${info.errorCode}`) },
      async () => {
        throw rejection();
      },
    );

    await expect(promise).rejects.toBeInstanceOf(WalletCliDeviceError);
    expect(events).toEqual(["failed:rejected"]);
  });

  it("does NOT emit success or failure when the caller renders the result afterwards", async () => {
    // Mirrors the command handlers: rendering happens on the returned value, outside withTracking,
    // so a render error cannot emit a spurious failure for an operation that already succeeded.
    const onSuccess = mock(() => {});
    const onFailed = mock(() => {});
    const render = mock((_r: string) => {
      throw new Error("render boom");
    });

    const result = await withTracking({ onSuccess, onFailed }, async () => "ok");
    expect(() => render(result)).toThrow("render boom");

    expect(onSuccess).toHaveBeenCalledTimes(1);
    expect(onFailed).not.toHaveBeenCalled();
  });
});
