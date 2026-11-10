import { TypedDataEncoder, Wallet } from "ethers";
import { from, lastValueFrom, throwError, toArray, type Observable } from "rxjs";
import type { DeviceConnectionResult } from "@features/platform-device-intent";
import { getBindingTypedData, type PredictionsTypedData } from "../binding";
import {
  predictionsBindingJob,
  type BindingSigningEvent,
  type PredictionsBindingJobState,
} from "../bindingIntent";
import { PredictionsBindingSignerMismatch } from "../errors";

const wallet = new Wallet(`0x${"11".repeat(32)}`);
const connection = {
  connectedDevice: { modelId: "stax" },
  compatDeviceName: "Stax",
} as unknown as DeviceConnectionResult;
const signingState = (isAwaitingConfirmation: boolean) => ({
  type: "signing",
  deviceModelId: "stax",
  deviceName: "Stax",
  isAwaitingConfirmation,
});

function signatureBy(signer: Wallet, { domain, types, message }: PredictionsTypedData): string {
  const { EIP712Domain: _domainType, ...messageTypes } = types;
  return signer.signingKey.sign(TypedDataEncoder.hash(domain, messageTypes, message)).serialized;
}

function run(signTypedData: (typedData: PredictionsTypedData) => Observable<BindingSigningEvent>) {
  const onResult = jest.fn();
  const job = predictionsBindingJob({
    deviceConnectionResult: connection,
    deviceExtractedContext: {} as never,
    input: {
      address: wallet.address,
      signTypedData: (_connection, typedData) => signTypedData(typedData),
    },
    onResult,
  });
  return { job, onResult };
}

/** The device asks for confirmation, twice like the Ethereum app's steps, then `signer` signs. */
const deviceSigning =
  (signer: Wallet) =>
  (typedData: PredictionsTypedData): Observable<BindingSigningEvent> => {
    const events: BindingSigningEvent[] = [
      { type: "awaiting-confirmation" },
      { type: "awaiting-confirmation" },
      { type: "signed", signature: signatureBy(signer, typedData) },
    ];
    return from(events);
  };

describe("predictionsBindingJob", () => {
  it("prepares, asks to confirm on the device once, then reports the binding and completes", async () => {
    const typedData = getBindingTypedData(wallet.address);
    const signTypedData = jest.fn(deviceSigning(wallet));
    const { job, onResult } = run(signTypedData);

    await expect(lastValueFrom(job.pipe(toArray()))).resolves.toEqual([
      signingState(false),
      signingState(true),
    ]);
    expect(signTypedData).toHaveBeenCalledWith(typedData);
    expect(onResult).toHaveBeenCalledWith({
      type: "bound",
      answer: { typedData, signature: signatureBy(wallet, typedData) },
    });
  });

  it("reports a mismatch when another key signed, without revealing that key, and ends on it", async () => {
    const otherWallet = new Wallet(`0x${"22".repeat(32)}`);
    const { job, onResult } = run(deviceSigning(otherWallet));

    await expect(lastValueFrom(job.pipe(toArray()))).resolves.toEqual([
      signingState(false),
      signingState(true),
      { type: "mismatch" },
    ]);
    expect(onResult).toHaveBeenCalledWith({
      type: "mismatch",
      error: expect.any(PredictionsBindingSignerMismatch),
    });
    expect(onResult.mock.calls[0][0].error.message).not.toMatch(
      new RegExp(otherWallet.address, "i"),
    );
  });

  it("shows a device error, then signs again on retry", async () => {
    const blindSigningDisabled = Object.assign(new Error("Enable blind signing"), {
      name: "EthAppPleaseEnableContractData",
    });
    const signTypedData = jest
      .fn<Observable<BindingSigningEvent>, [PredictionsTypedData]>()
      .mockReturnValueOnce(throwError(() => blindSigningDisabled))
      .mockImplementation(deviceSigning(wallet));
    const { job, onResult } = run(signTypedData);
    const states: PredictionsBindingJobState[] = [];

    const done = new Promise<void>(resolve => {
      job.subscribe({ next: state => states.push(state), complete: resolve });
    });
    const error = states.at(-1);
    expect(error).toMatchObject({ type: "error", error: blindSigningDisabled });
    if (error?.type !== "error") throw new Error("Expected an error state");
    error.retry();
    await done;

    expect(states.at(-1)).toEqual(signingState(true));
    expect(signTypedData).toHaveBeenCalledTimes(2);
    expect(onResult).toHaveBeenCalledWith(expect.objectContaining({ type: "bound" }));
  });

  it("leaves a lost connection to the executor", async () => {
    const disconnected = { _tag: "DeviceDisconnectedWhileSendingError" };
    const { job, onResult } = run(() => throwError(() => disconnected));

    await expect(lastValueFrom(job.pipe(toArray()))).rejects.toBe(disconnected);
    expect(onResult).not.toHaveBeenCalled();
  });
});
