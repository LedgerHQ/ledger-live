import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { ExchangeType } from "@ledgerhq/wallet-api-exchange-module";
import { DeviceModelId } from "@ledgerhq/types-devices";
import type { DeviceConnectionResult } from "@features/platform-device-intent";
import type { Account } from "@ledgerhq/types-live";
import { NEVER, type Observable, of, throwError } from "rxjs";
import { startNewExchangeTransaction } from "../../../platform/startExchange";
import {
  collectStates,
  deviceConnectionResult,
  deviceExtractedContext,
  flushPromises,
} from "../../tests/testUtils";
import { startExchangeIntentJob } from "../job";
import type { StartExchangeIntentInput, StartExchangeIntentResult } from "../types";

jest.mock("../../../platform/startExchange", () => ({
  startNewExchangeTransaction: jest.fn(),
}));

const mockStartNewExchangeTransaction = jest.mocked(startNewExchangeTransaction);

const fromAccount = {
  type: "Account",
  id: "account-1",
  currency: getCryptoCurrencyById("ethereum"),
} as Account;

const input: StartExchangeIntentInput = {
  exchangeType: ExchangeType.SWAP,
  provider: "changelly",
  exchange: { fromAccount },
};

function startJob(
  overrides?: Partial<StartExchangeIntentInput>,
  connection: DeviceConnectionResult = deviceConnectionResult,
) {
  const onResult = jest.fn<void, [StartExchangeIntentResult]>();
  const job$ = startExchangeIntentJob({
    deviceConnectionResult: connection,
    deviceExtractedContext,
    input: { ...input, ...overrides },
    onResult,
  });
  return { onResult, ...collectStates(job$) };
}

/** A connection whose session state is what `state$` replays. */
function connectionWithSessionState(state$: Observable<unknown>) {
  const getDeviceSessionState = jest.fn(() => state$);
  const connection = {
    ...deviceConnectionResult,
    dmk: { getDeviceSessionState } as unknown as DeviceConnectionResult["dmk"],
  };
  return { connection, getDeviceSessionState };
}

describe("startExchangeIntentJob", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("asks the Exchange app for a nonce on the executor's session", async () => {
    mockStartNewExchangeTransaction.mockResolvedValue("nonce-1");

    startJob();
    await flushPromises();

    expect(mockStartNewExchangeTransaction).toHaveBeenCalledWith(
      expect.objectContaining({ sessionId: "session-1" }),
      { exchangeType: ExchangeType.SWAP, provider: "changelly", appVersion: "3.5.0" },
      expect.any(Function),
    );
  });

  it("reports the nonce with the device and analytics context, then completes", async () => {
    mockStartNewExchangeTransaction.mockResolvedValue("nonce-1");

    const { states, completed, onResult } = startJob();
    await flushPromises();

    expect(states).toEqual([
      { type: "starting", deviceModelId: DeviceModelId.nanoX },
      { type: "nonce-ready", nonce: "nonce-1" },
    ]);
    expect(completed()).toBe(true);
    expect(onResult).toHaveBeenCalledTimes(1);
    expect(onResult).toHaveBeenCalledWith({
      status: "started",
      nonce: "nonce-1",
      device: {
        deviceId: "device-1",
        deviceName: "Device 1",
        modelId: DeviceModelId.nanoX,
        wired: true,
      },
      exchangeAppVersion: "3.5.0",
      signingAppName: "Ethereum",
    });
  });

  it("reports the installed version of the signing app the session listed", async () => {
    mockStartNewExchangeTransaction.mockResolvedValue("nonce-1");
    const { connection, getDeviceSessionState } = connectionWithSessionState(
      of({
        installedApps: [
          { versionName: "Bitcoin", version: "2.4.0" },
          { versionName: "Ethereum", version: "1.13.0" },
        ],
      }),
    );

    const { onResult } = startJob(undefined, connection);
    await flushPromises();

    expect(getDeviceSessionState).toHaveBeenCalledWith({ sessionId: "session-1" });
    expect(onResult).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "started",
        signingAppName: "Ethereum",
        signingAppVersion: "1.13.0",
      }),
    );
  });

  it.each([
    ["the session never listed the apps", of({ sessionStateType: "Connected" })],
    ["the signing app is not listed", of({ installedApps: [{ versionName: "Bitcoin" }] })],
    ["the session state fails", throwError(() => new Error("no session"))],
    ["the session state is not replayed", NEVER],
  ])("still starts, without a version, when %s", async (_name, state$) => {
    mockStartNewExchangeTransaction.mockResolvedValue("nonce-1");
    const { connection } = connectionWithSessionState(state$);

    const { completed, onResult } = startJob(undefined, connection);
    await flushPromises();

    expect(completed()).toBe(true);
    expect(onResult).toHaveBeenCalledWith(
      expect.objectContaining({ status: "started", signingAppName: "Ethereum" }),
    );
    expect(onResult).toHaveBeenCalledWith(
      expect.not.objectContaining({ signingAppVersion: expect.anything() }),
    );
  });

  it("leaves the signing app out when the exchange has no account yet", async () => {
    mockStartNewExchangeTransaction.mockResolvedValue("nonce-1");

    const { onResult } = startJob({ exchange: undefined });
    await flushPromises();

    expect(onResult).toHaveBeenCalledWith(
      expect.not.objectContaining({ signingAppName: expect.anything() }),
    );
  });

  it("models a failure as a state and a result instead of erroring", async () => {
    const failure = new Error("Incompatible AppExchange version with NG command");
    mockStartNewExchangeTransaction.mockRejectedValue(failure);

    const { states, completed, onResult } = startJob();
    await flushPromises();

    expect(states).toEqual([
      { type: "starting", deviceModelId: DeviceModelId.nanoX },
      { type: "error", error: failure },
    ]);
    expect(completed()).toBe(true);
    expect(onResult).toHaveBeenCalledWith({
      status: "failed",
      error: failure,
      device: expect.objectContaining({ deviceId: "device-1" }),
    });
  });

  it("normalizes a thrown value that is not an Error", async () => {
    mockStartNewExchangeTransaction.mockRejectedValue("boom");

    const { states } = startJob();
    await flushPromises();

    expect(states[1]).toEqual({ type: "error", error: new Error("boom") });
  });

  it("reports nothing once unsubscribed", async () => {
    let resolveNonce: (nonce: string) => void = () => undefined;
    mockStartNewExchangeTransaction.mockReturnValue(
      new Promise<string>(resolve => {
        resolveNonce = resolve;
      }),
    );

    const { states, onResult, unsubscribe } = startJob();
    unsubscribe();
    resolveNonce("nonce-1");
    await flushPromises();

    expect(states).toEqual([{ type: "starting", deviceModelId: DeviceModelId.nanoX }]);
    expect(onResult).not.toHaveBeenCalled();
  });
});
