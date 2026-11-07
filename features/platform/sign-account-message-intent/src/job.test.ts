import { SignatureRefusedError, type MessageSignEvent } from "@domain/api-account-transaction";
import type { DeviceConnectionResult } from "@features/platform-device-intent";
import { lastValueFrom, Observable, of, Subject, throwError, toArray } from "rxjs";
import { signAccountMessageIntentJob } from "./job";
import type { SignAccountMessageIntentJobState } from "./types";

const deviceConnectionResult = {
  dmk: {},
  sessionId: "session",
  compatDeviceId: "device",
  compatDeviceName: "Lily's Stax",
  connectedDevice: { modelId: "stax" },
} as unknown as DeviceConnectionResult;

const deviceExtractedContext = {
  currentOsVersion: "1.0.0",
  osUpdateAvailable: false,
  currentAppName: "Ethereum",
  currentAppVersion: "1.0.0",
};

const run = (sign: () => Observable<MessageSignEvent>, onResult = jest.fn()) =>
  signAccountMessageIntentJob({
    deviceConnectionResult,
    deviceExtractedContext,
    input: { sign },
    onResult,
  });

describe("signAccountMessageIntentJob", () => {
  it("should map the signing events and hand the signature to onResult", async () => {
    const onResult = jest.fn();
    const sign = jest.fn(() =>
      of<MessageSignEvent[]>(
        { type: "device-signature-requested" },
        { type: "signed", signature: "abcdef" },
      ),
    );
    const states = await lastValueFrom(run(sign, onResult).pipe(toArray()));
    expect(states.map(state => state.type)).toEqual([
      "pending",
      "device-signature-requested",
      "signed",
    ]);
    expect(sign).toHaveBeenCalledWith({ dmk: {}, sessionId: "session", compatDeviceId: "device" });
    expect(onResult).toHaveBeenCalledWith("abcdef");
  });

  it("should turn a refusal on the device into a retryable cancel", () => {
    const attempts: Subject<MessageSignEvent>[] = [];
    const sign = jest.fn(() => {
      const attempt = new Subject<MessageSignEvent>();
      attempts.push(attempt);
      return attempt;
    });
    const states: SignAccountMessageIntentJobState[] = [];
    let completed = false;
    run(sign).subscribe({ next: state => states.push(state), complete: () => (completed = true) });
    attempts[0].error(new SignatureRefusedError());
    const cancelled = states.at(-1);
    if (cancelled?.type !== "cancelled") throw new Error("expected a cancel");
    cancelled.retry();
    attempts[1].next({ type: "signed", signature: "00" });
    expect(states.map(state => state.type)).toEqual(["pending", "cancelled", "pending", "signed"]);
    expect(completed).toBe(true);
  });

  it("should fail on any other error", async () => {
    await expect(
      lastValueFrom(run(() => throwError(() => new Error("disconnected")))),
    ).rejects.toThrow("disconnected");
  });

  it("should fail when signing ends without a signature", async () => {
    await expect(
      lastValueFrom(run(() => of<MessageSignEvent>({ type: "device-signature-requested" }))),
    ).rejects.toThrow("without a signature");
  });
});
