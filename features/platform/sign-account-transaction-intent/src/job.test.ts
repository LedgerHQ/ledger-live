import {
  SignatureRefusedError,
  type SendSignEvent,
  type SignedSend,
} from "@domain/api-account-transaction";
import { AccountDataSourceIdSchema } from "@domain/entity-account-data";
import { computeAccountUUID } from "@domain/entity-account-descriptor";
import { mockAddressAccountDescriptor } from "@domain/entity-account-descriptor/schema.mock";
import type { DeviceConnectionResult } from "@features/platform-device-intent";
import { lastValueFrom, Observable, of, Subject, throwError, toArray } from "rxjs";
import { signAccountTransactionIntentJob } from "./job";
import type { SignAccountTransactionIntentJobState } from "./types";

const deviceConnectionResult = {
  dmk: {},
  sessionId: "session",
  compatDeviceId: "device",
  connectedDevice: { modelId: "stax" },
} as unknown as DeviceConnectionResult;

const deviceExtractedContext = {
  currentOsVersion: "1.0.0",
  osUpdateAvailable: false,
  currentAppName: "Ethereum",
  currentAppVersion: "1.0.0",
};

const signedSend = (payload: string): SignedSend => ({
  preparationId: "prep-1",
  accountUUID: computeAccountUUID(mockAddressAccountDescriptor()),
  sourceId: AccountDataSourceIdSchema.parse("source"),
  signed: { payload },
});

const run = (sign: () => Observable<SendSignEvent>, onResult = jest.fn()) =>
  signAccountTransactionIntentJob({
    deviceConnectionResult,
    deviceExtractedContext,
    input: { sign },
    onResult,
  });

describe("signAccountTransactionIntentJob", () => {
  it("should map the signing events and hand the signature to onResult", async () => {
    const onResult = jest.fn();
    const sign = jest.fn(() =>
      of<SendSignEvent[]>(
        { type: "device-signature-requested" },
        { type: "device-streaming", progress: 0.5 },
        { type: "device-signature-granted" },
        { type: "signed", signed: signedSend("0xsigned") },
      ),
    );
    const states = await lastValueFrom(run(sign, onResult).pipe(toArray()));
    expect(states.map(state => state.type)).toEqual([
      "pending",
      "device-signature-requested",
      "device-streaming",
      "device-signature-granted",
      "signed",
    ]);
    expect(sign).toHaveBeenCalledWith({
      dmk: {},
      sessionId: "session",
      compatDeviceId: "device",
      deviceModelId: "stax",
    });
    expect(onResult).toHaveBeenCalledWith(signedSend("0xsigned"));
  });

  it("should turn a refusal on the device into a retryable cancel", () => {
    const attempts: Subject<SendSignEvent>[] = [];
    const sign = jest.fn(() => {
      const attempt = new Subject<SendSignEvent>();
      attempts.push(attempt);
      return attempt;
    });
    const states: SignAccountTransactionIntentJobState[] = [];
    let completed = false;
    run(sign).subscribe({ next: state => states.push(state), complete: () => (completed = true) });
    attempts[0].error(new SignatureRefusedError());
    const cancelled = states.at(-1);
    if (cancelled?.type !== "cancelled") throw new Error("expected a cancel");
    cancelled.retry();
    attempts[1].next({ type: "signed", signed: signedSend("0x") });
    expect(states.map(state => state.type)).toEqual(["pending", "cancelled", "pending", "signed"]);
    expect(completed).toBe(true);
  });

  it("should end on an error state for any other failure, never erroring the observable", async () => {
    const states = await lastValueFrom(
      run(() => throwError(() => new Error("disconnected"))).pipe(toArray()),
    );
    expect(states.at(-1)).toEqual({ type: "error", error: new Error("disconnected") });
  });

  it("should end on an error state when signing ends without a signature", async () => {
    const states = await lastValueFrom(
      run(() => of<SendSignEvent>({ type: "device-signature-requested" })).pipe(toArray()),
    );
    expect(states.at(-1)).toEqual({
      type: "error",
      error: new Error("Signing ended without a signature"),
    });
  });

  it("should not sign again when a kept retry is called after the job was cancelled", () => {
    const sign = jest.fn(() => throwError(() => new SignatureRefusedError()));
    const states: SignAccountTransactionIntentJobState[] = [];
    const subscription = run(sign).subscribe(state => states.push(state));
    const cancelled = states.at(-1);
    if (cancelled?.type !== "cancelled") throw new Error("expected a cancel");
    subscription.unsubscribe();
    cancelled.retry();
    expect(sign).toHaveBeenCalledTimes(1);
  });
});
