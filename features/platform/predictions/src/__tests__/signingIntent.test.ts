import { TypedDataEncoder, Wallet } from "ethers";
import { from, lastValueFrom, Observable, throwError, toArray } from "rxjs";
import type { DeviceConnectionResult } from "@features/platform-device-intent";
import {
  PLACE_ORDER_SIGNED_AT_MS,
  PLACE_ORDER_TYPED_DATA,
} from "../__fixtures__/placeOrderTypedData";
import { SELL_POSITION_TYPED_DATA } from "../__fixtures__/sellPositionTypedData";
import { getBindingTypedData } from "../binding";
import {
  predictionsSigningJob,
  type PredictionsSigningEvent,
  type PredictionsSigningIntentInput,
  type PredictionsSigningJobState,
} from "../signingIntent";
import type { PredictionsTypedData } from "../typedData";
import { PredictionsBindingSignerMismatch, PredictionsOrderExpired } from "../errors";

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

const ORDER_TYPED_DATA: PredictionsTypedData = {
  ...PLACE_ORDER_TYPED_DATA,
  domain: { ...PLACE_ORDER_TYPED_DATA.domain, chainId: 137 },
};
const SALE_TYPED_DATA: PredictionsTypedData = {
  ...SELL_POSITION_TYPED_DATA,
  domain: { ...SELL_POSITION_TYPED_DATA.domain, chainId: 137 },
};

function run(
  signTypedData: (typedData: PredictionsTypedData) => Observable<PredictionsSigningEvent>,
  { purpose, typedData }: Pick<PredictionsSigningIntentInput, "purpose" | "typedData"> = {
    purpose: "binding",
    typedData: getBindingTypedData(wallet.address),
  },
) {
  const onResult = jest.fn();
  const job = predictionsSigningJob({
    deviceConnectionResult: connection,
    deviceExtractedContext: {} as never,
    input: {
      purpose,
      address: wallet.address,
      typedData,
      signTypedData: (_connection, typedData) => signTypedData(typedData),
    },
    onResult,
  });
  return { job, onResult };
}

/** The device asks for confirmation, twice like the Ethereum app's steps, then `signer` signs. */
const deviceSigning =
  (signer: Wallet) =>
  (typedData: PredictionsTypedData): Observable<PredictionsSigningEvent> => {
    const events: PredictionsSigningEvent[] = [
      { type: "awaiting-confirmation" },
      { type: "awaiting-confirmation" },
      { type: "signed", signature: signatureBy(signer, typedData) },
    ];
    return from(events);
  };

describe("predictionsSigningJob", () => {
  it("prepares, asks to confirm on the device once, then reports the signature and completes", async () => {
    const typedData = getBindingTypedData(wallet.address);
    const signTypedData = jest.fn(deviceSigning(wallet));
    const { job, onResult } = run(signTypedData);

    await expect(lastValueFrom(job.pipe(toArray()))).resolves.toEqual([
      signingState(false),
      signingState(true),
    ]);
    expect(signTypedData).toHaveBeenCalledWith(typedData);
    expect(onResult).toHaveBeenCalledWith({
      type: "signed",
      signature: signatureBy(wallet, typedData),
    });
  });

  it("signs the request's typed data as is and checks the signer against it", async () => {
    const binding = getBindingTypedData(wallet.address);
    const typedData = { ...binding, message: { ...binding.message, notice: "Another notice" } };
    const signTypedData = jest.fn(deviceSigning(wallet));
    const { job, onResult } = run(signTypedData, { purpose: "binding", typedData });

    await lastValueFrom(job.pipe(toArray()));

    expect(signTypedData).toHaveBeenCalledWith(typedData);
    expect(onResult).toHaveBeenCalledWith({
      type: "signed",
      signature: signatureBy(wallet, typedData),
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
      .fn<Observable<PredictionsSigningEvent>, [PredictionsTypedData]>()
      .mockReturnValueOnce(throwError(() => blindSigningDisabled))
      .mockImplementation(deviceSigning(wallet));
    const { job, onResult } = run(signTypedData);
    const states: PredictionsSigningJobState[] = [];

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
    expect(onResult).toHaveBeenCalledWith(expect.objectContaining({ type: "signed" }));
  });

  it.each([
    ["order", ORDER_TYPED_DATA, "The order expired before it was signed"],
    ["sale", SALE_TYPED_DATA, "The sale expired before it was signed"],
  ] as const)(
    "ends without asking the device when the %s expired before a retry",
    async (purpose, typedData, message) => {
      const now = jest.spyOn(Date, "now").mockReturnValue(PLACE_ORDER_SIGNED_AT_MS);
      const signTypedData = jest
        .fn<Observable<PredictionsSigningEvent>, [PredictionsTypedData]>()
        .mockReturnValue(throwError(() => new Error("Bluetooth lost")));
      const { job, onResult } = run(signTypedData, { purpose, typedData });
      const states: PredictionsSigningJobState[] = [];
      const done = new Promise<void>(resolve => {
        job.subscribe({ next: state => states.push(state), complete: resolve });
      });
      const error = states.at(-1);
      if (error?.type !== "error") throw new Error("Expected an error state");

      now.mockReturnValue(PLACE_ORDER_SIGNED_AT_MS + 2 * 60 * 1000);
      error.retry();
      await done;

      expect(signTypedData).toHaveBeenCalledTimes(1);
      expect(onResult).toHaveBeenCalledWith({
        type: "expired",
        error: expect.any(PredictionsOrderExpired),
      });
      expect(onResult.mock.calls[0][0].error.message).toBe(message);
      now.mockRestore();
    },
  );

  it.each([
    ["order", ORDER_TYPED_DATA],
    ["sale", SALE_TYPED_DATA],
  ] as const)(
    "answers that the %s expired, not its signature, when the user confirms too late",
    async (purpose, typedData) => {
      const now = jest.spyOn(Date, "now").mockReturnValue(PLACE_ORDER_SIGNED_AT_MS);
      const confirmingTooLate = () =>
        new Observable<PredictionsSigningEvent>(device => {
          device.next({ type: "awaiting-confirmation" });
          now.mockReturnValue(PLACE_ORDER_SIGNED_AT_MS + 2 * 60 * 1000);
          device.next({ type: "signed", signature: signatureBy(wallet, typedData) });
          device.complete();
        });
      const { job, onResult } = run(confirmingTooLate, { purpose, typedData });

      await lastValueFrom(job.pipe(toArray()));

      expect(onResult).toHaveBeenCalledTimes(1);
      expect(onResult).toHaveBeenCalledWith({
        type: "expired",
        error: expect.any(PredictionsOrderExpired),
      });
      now.mockRestore();
    },
  );

  it("leaves a lost connection to the executor", async () => {
    const disconnected = { _tag: "DeviceDisconnectedWhileSendingError" };
    const { job, onResult } = run(() => throwError(() => disconnected));

    await expect(lastValueFrom(job.pipe(toArray()))).rejects.toBe(disconnected);
    expect(onResult).not.toHaveBeenCalled();
  });
});
