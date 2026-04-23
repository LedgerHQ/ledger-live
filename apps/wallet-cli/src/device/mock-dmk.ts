import { BehaviorSubject, Observable } from "rxjs";
import {
  DeviceActionStatus,
  DeviceStatus,
  DeviceSessionStateType,
  DeviceModelId,
  DeviceModel,
  ApduResponse,
  noopLoggerFactory,
} from "@ledgerhq/device-management-kit";
import type {
  DiscoveredDevice,
  ExecuteDeviceActionReturnType,
  DeviceSessionState,
  DeviceAction,
  DmkError,
  DeviceActionIntermediateValue,
  DeviceActionState,
  LoggerPublisherService,
} from "@ledgerhq/device-management-kit";

export type MockDeviceState = "connected" | "locked";

/**
 * Per-app result map: appName → object returned as the CallTaskInApp action output.
 * Shape is coin-specific and must match what the signer expects for that app.
 * Example for Ethereum: { "Ethereum": { publicKey: "...", address: "0x..." } }
 * Example for Solana:   { "Solana": { address: Buffer.from("...") } }
 * Example for Bitcoin:  { "Bitcoin": { publicKey: "...", bitcoinAddress: "..." } }
 */
export type MockAppResults = Record<string, Record<string, unknown>>;

const FAKE_DEVICE: DiscoveredDevice = {
  id: "mock-device-id",
  name: "Ledger Nano S Plus (mock)",
  deviceModel: new DeviceModel({
    id: "mock-device-id",
    model: DeviceModelId.NANO_SP,
    name: "Ledger Nano S Plus",
  }),
  transport: "mock-transport",
};

/**
 * Minimal mock of DeviceManagementKit for integration tests.
 *
 * Mocks at the executeDeviceAction level — the XState machine and InternalApi
 * are bypassed entirely. E2E tests with real hardware cover the layers omitted here.
 *
 *  - ConnectAppDeviceAction (input.application) → Completed immediately
 *  - CallTaskInAppDeviceAction (input.task, input.appName) → Completed with appResults[appName]
 *
 * Device state is controlled via `initialState`.
 * Coin-specific task results are provided via `appResults`.
 */
export class MockDeviceManagementKit {
  private readonly _state: MockDeviceState;
  private readonly _appResults: MockAppResults;

  constructor({
    initialState = "connected",
    appResults = {},
  }: {
    initialState?: MockDeviceState;
    appResults?: MockAppResults;
  } = {}) {
    this._state = initialState;
    this._appResults = appResults;
  }

  // ── DMK interface (used by register-dmk-transport.ts) ─────────────────────

  listenToAvailableDevices(_args: unknown): Observable<DiscoveredDevice[]> {
    return new BehaviorSubject([FAKE_DEVICE]).asObservable();
  }

  connect(_args: unknown): Promise<string> {
    return Promise.resolve("mock-session-id");
  }

  getDeviceSessionState(_args: unknown): Observable<DeviceSessionState> {
    const deviceStatus = this._state === "locked" ? DeviceStatus.LOCKED : DeviceStatus.CONNECTED;
    const state: DeviceSessionState = {
      sessionStateType: DeviceSessionStateType.Connected,
      deviceStatus,
      deviceModelId: DeviceModelId.NANO_SP,
    };
    return new BehaviorSubject<DeviceSessionState>(state).asObservable();
  }

  disconnect(_args: unknown): Promise<void> {
    return Promise.resolve();
  }

  close(): void {
    // no-op
  }

  // ── DMK interface (used by SignerEthBuilder → ContextModuleBuilder) ────────

  /** Returns a logger factory. Returns no-op loggers so we don't produce noise during tests. */
  getLoggerFactory(): (tag: string) => LoggerPublisherService {
    return noopLoggerFactory;
  }

  // ── DMK interface (used by connect-ledger-app.ts and DmkSignerEth) ─────────

  executeDeviceAction<
    Output,
    Error extends DmkError,
    IntermediateValue extends DeviceActionIntermediateValue,
    Input,
  >({
    deviceAction,
  }: {
    sessionId: string;
    deviceAction: DeviceAction<Output, Input, Error, IntermediateValue>;
  }): ExecuteDeviceActionReturnType<Output, Error, IntermediateValue> {
    if (this._state === "locked") {
      return this._lockedAction<Output, Error, IntermediateValue>();
    }

    const input = deviceAction.input as Record<string, unknown>;

    // ConnectAppDeviceAction: input.application → return Completed immediately
    if (input.application !== undefined) {
      return this._completedAction<Output, Error, IntermediateValue>({} as Output);
    }

    // CallTaskInAppDeviceAction: input.task is a function → return configured result
    if (typeof input.task === "function") {
      const appName = typeof input.appName === "string" ? input.appName : "";
      const result = this._appResults[appName] ?? {};
      return this._completedAction<Output, Error, IntermediateValue>(result as Output);
    }

    // Fallback: Completed with empty output
    return this._completedAction<Output, Error, IntermediateValue>({} as Output);
  }

  // ── DMK interface (used by WalletCliDmkTransport.exchange — fallback path) ─

  sendApdu(_args: {
    sessionId?: string;
    apdu: Uint8Array;
    abortTimeout?: number;
  }): Promise<ApduResponse> {
    if (this._state === "locked") {
      return Promise.resolve(
        new ApduResponse({ statusCode: new Uint8Array([0x55, 0x15]), data: new Uint8Array(0) }),
      );
    }
    // Unknown APDU: INS not supported
    return Promise.resolve(
      new ApduResponse({ statusCode: new Uint8Array([0x6d, 0x00]), data: new Uint8Array(0) }),
    );
  }

  // ── Private helpers ────────────────────────────────────────────────────────

  private _completedAction<Output, Error, IntermediateValue>(
    output: Output,
  ): ExecuteDeviceActionReturnType<Output, Error, IntermediateValue> {
    const observable = new Observable<DeviceActionState<Output, Error, IntermediateValue>>(
      subscriber => {
        subscriber.next({ status: DeviceActionStatus.Completed, output });
        subscriber.complete();
      },
    );
    return { observable, cancel: () => {} };
  }

  private _lockedAction<Output, Error, IntermediateValue>(): ExecuteDeviceActionReturnType<
    Output,
    Error,
    IntermediateValue
  > {
    const observable = new Observable<DeviceActionState<Output, Error, IntermediateValue>>(
      subscriber => {
        subscriber.next({
          status: DeviceActionStatus.Error,
          // Note: DmkSignerEth._mapError will produce new Error(undefined) = empty message.
          // A future improvement would emit a proper DmkError with errorCode "5515".
          error: { _tag: "LockedDevice" } as unknown as Error,
        });
        subscriber.complete();
      },
    );
    return { observable, cancel: () => {} };
  }
}
