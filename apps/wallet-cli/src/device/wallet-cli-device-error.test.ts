import { describe, expect, it } from "bun:test";
import { SendApduTimeoutError } from "@ledgerhq/device-management-kit";
import { LockedDeviceError, ManagerDeviceLockedError } from "@ledgerhq/errors";
import { StatusCodes, TransportStatusError } from "@ledgerhq/hw-transport";
import { toWalletCliDeviceError } from "./wallet-cli-device-error";

describe("toWalletCliDeviceError", () => {
  it("maps LOCKED_DEVICE / LockedDeviceError to a wallet-cli locked message", () => {
    const fromSw = toWalletCliDeviceError(new TransportStatusError(StatusCodes.LOCKED_DEVICE));
    expect(fromSw.message).toContain("locked");
    expect(fromSw.message).toContain("[wallet-cli]");
    expect(fromSw.cause).toBeInstanceOf(LockedDeviceError);

    const direct = toWalletCliDeviceError(new LockedDeviceError());
    expect(direct.message).toContain("locked");
    expect(direct.cause).toBeInstanceOf(LockedDeviceError);
  });

  it("maps ManagerDeviceLockedError", () => {
    const out = toWalletCliDeviceError(new ManagerDeviceLockedError());
    expect(out.message).toContain("[wallet-cli]");
    expect(out.message).toContain("locked");
    expect(out.cause).toBeInstanceOf(ManagerDeviceLockedError);
  });

  it("maps SECURITY_STATUS_NOT_SATISFIED (0x6982)", () => {
    const out = toWalletCliDeviceError(new TransportStatusError(0x6982));
    expect(out.message).toContain("[wallet-cli]");
    expect(out.message).toMatch(/security|locked/i);
    expect(out.cause).toBeInstanceOf(TransportStatusError);
  });

  it("maps CONDITIONS_OF_USE_NOT_SATISFIED (0x6985)", () => {
    const out = toWalletCliDeviceError(new TransportStatusError(0x6985));
    expect(out.message).toMatch(/rejected|cancelled/i);
    expect(out.cause).toBeInstanceOf(TransportStatusError);
  });

  it("maps CLA_NOT_SUPPORTED and INS_NOT_SUPPORTED", () => {
    const cla = toWalletCliDeviceError(new TransportStatusError(StatusCodes.CLA_NOT_SUPPORTED));
    expect(cla.message).toContain("correct app");
    const ins = toWalletCliDeviceError(new TransportStatusError(StatusCodes.INS_NOT_SUPPORTED));
    expect(ins.message).toContain("correct app");
  });

  it("maps SendApduTimeoutError and tagged SendApduTimeout", () => {
    const inst = toWalletCliDeviceError(new SendApduTimeoutError("t"));
    expect(inst.message).toContain("Timed out");
    expect(inst.message).toMatch(/PIN|locked/i);
    expect(inst.cause).toBeInstanceOf(SendApduTimeoutError);

    const tagged = toWalletCliDeviceError({ _tag: "SendApduTimeoutError" as const });
    expect(tagged.message).toContain("Timed out");
  });

  it("maps transport framing errors (ReceiverApduError, UnknownDeviceExchangeError) to a user-friendly message", () => {
    const receiver = toWalletCliDeviceError({ _tag: "ReceiverApduError" as const });
    expect(receiver.message).toContain("[wallet-cli]");
    expect(receiver.message).toMatch(/communicate|locked/i);
    expect(receiver.cause).toEqual({ _tag: "ReceiverApduError" });

    const exchange = toWalletCliDeviceError({ _tag: "UnknownDeviceExchangeError" as const });
    expect(exchange.message).toContain("[wallet-cli]");
    expect(exchange.message).toMatch(/communicate|locked/i);
    expect(exchange.cause).toEqual({ _tag: "UnknownDeviceExchangeError" });
  });

  it("passes through unrelated Error instances", () => {
    const err = new Error("custom");
    expect(toWalletCliDeviceError(err)).toBe(err);
  });

  it("wraps non-Error values", () => {
    const out = toWalletCliDeviceError("oops");
    expect(out.message).toBe("oops");
  });
});
