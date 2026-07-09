import { afterAll, beforeAll, describe, expect, it, mock } from "bun:test";
import type { ApplicationDependency } from "@ledgerhq/device-management-kit";
import type { AccountDescriptor, SendEvent } from "./models";
import type { CommandOutput } from "../output";
import type { WalletAdapter } from "./index";
import type { TransactionIntent } from "./intents";

// Capture the args `signAndBroadcastIntent` forwards to the device-session helper. The mock invokes
// the callback so the inner sign+broadcast block runs without touching a real device.
type SessionOptions = { dependencies?: ApplicationDependency[]; deviceTimeoutMs?: number };
let capturedCurrencyId: string | undefined;
let capturedSessionOptions: SessionOptions | undefined;
const withCurrencyDeviceSession = mock(
  async <T>(currencyId: string, fn: () => Promise<T>, options?: SessionOptions): Promise<T> => {
    capturedCurrencyId = currencyId;
    capturedSessionOptions = options;
    return fn();
  },
);

// Emit a single `broadcasted` event so the helper captures the txHash, mirroring the bridge stream.
let broadcastTxHash = "0xfeedface";
const runObservable = mock(async ({ onNext }: { onNext?: (value: SendEvent) => void }) => {
  onNext?.({ type: "broadcasted", txHash: broadcastTxHash });
});

// `mock.module` is global for the whole bun process — it is installed during the collection phase
// (before any test runs) and `mock.restore()` does not revert it. To avoid bleeding these device-layer
// fakes into the send / genuine-check / device suites, every override delegates to the REAL export
// unless `mockActive` is set, which only happens while this file's own tests run (see beforeAll/afterAll).
// We snapshot the real exports into plain objects BEFORE installing the mocks: bun re-binds the live
// module namespace to the mock once mock.module runs, so reading the namespace at call time would
// re-enter the mock (and recurse forever). The snapshot keeps real function references.
let mockActive = false;
const realBridge = { ...(await import("../session/bridge-device-session")) };
const realRegisterDmk = { ...(await import("../device/register-dmk-transport")) };
const realRunObservable = { ...(await import("../commands/run-observable")) };

mock.module("../session/bridge-device-session", () => ({
  ...realBridge,
  withCurrencyDeviceSession: ((...args: Parameters<typeof realBridge.withCurrencyDeviceSession>) =>
    mockActive
      ? withCurrencyDeviceSession(...args)
      : realBridge.withCurrencyDeviceSession(
          ...args,
        )) as typeof realBridge.withCurrencyDeviceSession,
}));

mock.module("../device/register-dmk-transport", () => ({
  ...realRegisterDmk,
  getWalletCliDeviceModelId: ((
    ...args: Parameters<typeof realRegisterDmk.getWalletCliDeviceModelId>
  ) =>
    mockActive
      ? Promise.resolve("nanoX")
      : realRegisterDmk.getWalletCliDeviceModelId(
          ...args,
        )) as typeof realRegisterDmk.getWalletCliDeviceModelId,
}));

mock.module("../commands/run-observable", () => ({
  ...realRunObservable,
  runObservable: ((...args: Parameters<typeof realRunObservable.runObservable>) =>
    mockActive
      ? runObservable(...(args as [{ onNext?: (value: SendEvent) => void }]))
      : realRunObservable.runObservable(...args)) as typeof realRunObservable.runObservable,
}));

const { signAndBroadcastIntent, prepareIntentDryRun } = await import("./sign-and-broadcast");

beforeAll(() => {
  mockActive = true;
});

afterAll(() => {
  // Scope the fakes to this file only, then drop the spies, so nothing bleeds into other test files.
  mockActive = false;
  mock.restore();
});

const descriptor = {
  id: "acc-1",
  currencyId: "ethereum",
  freshAddress: "0x1111111111111111111111111111111111111111",
} as unknown as AccountDescriptor;

const intent = {
  family: "evm",
  recipient: "0x2222",
  amount: "0 ETH",
} as unknown as TransactionIntent;

function makeOut(overrides: Partial<CommandOutput> = {}): CommandOutput {
  return {
    spin: () => null,
    sendEvent: () => {},
    sendComplete: () => {},
    sendDryRun: () => {},
    deviceState: () => {},
    ...overrides,
  } as unknown as CommandOutput;
}

describe("signAndBroadcastIntent", () => {
  it("returns the captured broadcast txHash", async () => {
    broadcastTxHash = "0xfeedface";
    const send = mock(() => undefined);
    const wallet = { send } as unknown as WalletAdapter;

    const result = await signAndBroadcastIntent({
      wallet,
      descriptor,
      intent,
      deviceId: "device-1",
      managerAppName: "Ethereum",
      out: makeOut(),
    });

    expect(result.txHash).toBe("0xfeedface");
    expect(send).toHaveBeenCalledTimes(1);
  });

  it("does not emit a final envelope (caller owns sendComplete)", async () => {
    // The helper must only stream progress; emitting sendComplete here would leak an intermediate
    // success envelope into earn flows' JSON output (they call the helper then emit their own result).
    const sendComplete = mock(() => {});
    const wallet = { send: () => undefined } as unknown as WalletAdapter;

    await signAndBroadcastIntent({
      wallet,
      descriptor,
      intent,
      deviceId: "device-1",
      managerAppName: "Ethereum",
      out: makeOut({ sendComplete }),
    });

    expect(sendComplete).toHaveBeenCalledTimes(0);
  });

  it("forwards dependencies and the currency id to withCurrencyDeviceSession", async () => {
    capturedCurrencyId = undefined;
    capturedSessionOptions = undefined;
    const dependencies: ApplicationDependency[] = [{ name: "Kiln" }];
    const wallet = { send: () => undefined } as unknown as WalletAdapter;

    await signAndBroadcastIntent({
      wallet,
      descriptor,
      intent,
      deviceId: "device-1",
      managerAppName: "Ethereum",
      deviceTimeoutMs: 1234,
      dependencies,
      out: makeOut(),
    });

    expect(capturedCurrencyId as string | undefined).toBe(descriptor.currencyId);
    expect((capturedSessionOptions as SessionOptions | undefined)?.dependencies).toEqual(
      dependencies,
    );
    expect((capturedSessionOptions as SessionOptions | undefined)?.deviceTimeoutMs).toBe(1234);
  });
});

describe("prepareIntentDryRun", () => {
  it("calls wallet.prepareSend and returns the prepared tx without emitting an envelope", async () => {
    // The helper must NOT emit the terminal envelope: the caller owns it (`send` -> out.sendDryRun,
    // earn -> its own deposit/withdraw result), so each command emits exactly one terminal envelope.
    const prepared = { amount: "0 ETH", fees: "0.0001 ETH", recipient: "0x2222" };
    const prepareSend = mock(
      async (_descriptor: AccountDescriptor, _intent: TransactionIntent) => prepared,
    );
    const sendDryRun = mock(() => {});
    const wallet = { prepareSend } as unknown as WalletAdapter;
    const out = { spin: () => null, sendDryRun } as unknown as CommandOutput;

    const result = await prepareIntentDryRun({ wallet, descriptor, intent, out });

    expect(prepareSend).toHaveBeenCalledTimes(1);
    expect(prepareSend.mock.calls[0]).toEqual([descriptor, intent]);
    expect(sendDryRun).toHaveBeenCalledTimes(0);
    expect(result).toBe(prepared);
  });
});
