import { describe, expect, it } from "bun:test";
import { SendApduTimeoutError } from "@ledgerhq/device-management-kit";
import { LockedDeviceError, ManagerDeviceLockedError } from "@ledgerhq/errors";
import { StatusCodes, TransportStatusError } from "@ledgerhq/hw-transport";
import { DEVICE_EXIT_CODES } from "./device-state";
import { toWalletCliDeviceError, WalletCliDeviceError } from "./wallet-cli-device-error";

describe("WalletCliDeviceError / toWalletCliDeviceError", () => {
  it("LOCKED_DEVICE / LockedDeviceError → state.code=locked, exitCode=6", () => {
    const fromSw = toWalletCliDeviceError(new TransportStatusError(StatusCodes.LOCKED_DEVICE));
    expect(fromSw).toBeInstanceOf(WalletCliDeviceError);
    expect(fromSw.state.code).toBe("locked");
    expect(fromSw.exitCode).toBe(DEVICE_EXIT_CODES.timeout);
    expect(fromSw.message).toMatch(/locked/i);
    expect(fromSw.cause).toBeInstanceOf(TransportStatusError);

    const direct = toWalletCliDeviceError(new LockedDeviceError());
    expect(direct.state.code).toBe("locked");
    expect(direct.cause).toBeInstanceOf(LockedDeviceError);
  });

  it("ManagerDeviceLockedError → locked", () => {
    const out = toWalletCliDeviceError(new ManagerDeviceLockedError());
    expect(out.state.code).toBe("locked");
    expect(out.cause).toBeInstanceOf(ManagerDeviceLockedError);
  });

  it("SECURITY_STATUS_NOT_SATISFIED (0x6982) → locked", () => {
    const out = toWalletCliDeviceError(new TransportStatusError(0x6982));
    expect(out.state.code).toBe("locked");
    expect(out.cause).toBeInstanceOf(TransportStatusError);
  });

  it("CONDITIONS_OF_USE_NOT_SATISFIED (0x6985) → rejected, exit 2", () => {
    const out = toWalletCliDeviceError(new TransportStatusError(0x6985));
    expect(out.state.code).toBe("rejected");
    expect(out.exitCode).toBe(DEVICE_EXIT_CODES.rejected);
    expect(out.message).toMatch(/rejected/i);
  });

  it("CLA_NOT_SUPPORTED / INS_NOT_SUPPORTED → wrong_app with expectedApp, exit 4", () => {
    const cla = toWalletCliDeviceError(new TransportStatusError(StatusCodes.CLA_NOT_SUPPORTED), {
      expectedApp: "Ethereum",
    });
    expect(cla.state.code).toBe("wrong_app");
    expect(cla.exitCode).toBe(DEVICE_EXIT_CODES.wrong_app);
    expect(cla.message).toMatch(/Ethereum/);

    const ins = toWalletCliDeviceError(new TransportStatusError(StatusCodes.INS_NOT_SUPPORTED), {
      expectedApp: "Bitcoin",
    });
    expect(ins.state.code).toBe("wrong_app");
    expect(ins.message).toMatch(/Bitcoin/);
  });

  it("SendApduTimeoutError and tagged SendApduTimeout → timeout, exit 6", () => {
    const inst = toWalletCliDeviceError(new SendApduTimeoutError("t"));
    expect(inst.state.code).toBe("timeout");
    expect(inst.exitCode).toBe(DEVICE_EXIT_CODES.timeout);
    expect(inst.message).toMatch(/Timed out/);

    const tagged = toWalletCliDeviceError({ _tag: "SendApduTimeoutError" as const });
    expect(tagged.state.code).toBe("timeout");
  });

  it("transport framing errors (ReceiverApduError, UnknownDeviceExchangeError) → timeout", () => {
    const receiver = toWalletCliDeviceError({ _tag: "ReceiverApduError" as const });
    expect(receiver.state.code).toBe("timeout");
    expect(receiver.cause).toEqual({ _tag: "ReceiverApduError" });

    const exchange = toWalletCliDeviceError({ _tag: "UnknownDeviceExchangeError" as const });
    expect(exchange.state.code).toBe("timeout");
  });

  it("wraps non-device Error instances as unknown with exit 1", () => {
    const err = new Error("custom");
    const out = toWalletCliDeviceError(err);
    expect(out).toBeInstanceOf(WalletCliDeviceError);
    expect(out.state.code).toBe("unknown");
    expect(out.exitCode).toBe(DEVICE_EXIT_CODES.generic);
    expect(out.message).toBe("custom");
    expect(out.cause).toBe(err);
  });

  it("fromKnownDeviceError leaves non-device errors unwrapped", () => {
    const err = new Error("validation failed");
    expect(WalletCliDeviceError.fromKnownDeviceError(err)).toBeUndefined();
  });

  it("fromKnownDeviceError wraps classified device errors", () => {
    const err = new TransportStatusError(StatusCodes.CONDITIONS_OF_USE_NOT_SATISFIED);
    const out = WalletCliDeviceError.fromKnownDeviceError(err, { rejectedContext: "sign" });
    expect(out).toBeInstanceOf(WalletCliDeviceError);
    expect(out?.state.code).toBe("rejected");
    expect(out?.cause).toBe(err);
  });

  it("returns the same instance when given an existing WalletCliDeviceError", () => {
    const original = new WalletCliDeviceError({ code: "disconnected" });
    const out = toWalletCliDeviceError(original);
    expect(out).toBe(original);
  });

  it("wraps non-Error values", () => {
    const out = toWalletCliDeviceError("oops");
    expect(out.state.code).toBe("unknown");
    expect(out.message).toBe("oops");
  });
});
