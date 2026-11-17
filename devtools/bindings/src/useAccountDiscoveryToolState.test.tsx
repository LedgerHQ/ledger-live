import React, { type PropsWithChildren } from "react";
import { act, renderHook, waitFor } from "@testing-library/react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import { accountDataExtra, type AccountDataSource } from "@domain/api-account-data";
import { AccountDataSourceIdSchema } from "@domain/entity-account-data";
import { AccountDescriptorSchema } from "@domain/entity-account-descriptor";
import type { DeriveAccount, DiscoveredAccount } from "@features/platform-account-discovery";
import type {
  DeviceConnectionResult,
  DeviceExtractedContext,
} from "@features/platform-device-intent";
import { createScanAccountsIntentDefinition } from "@features/platform-intent-scan-accounts";
import {
  useAccountDiscoveryToolState,
  type AccountDiscoveryInputs,
  type AccountDiscoveryIntent,
  type AccountDiscoveryIntentPlatformDefinition,
} from "./useAccountDiscoveryToolState";

const derive: DeriveAccount = async candidate =>
  AccountDescriptorSchema.parse({
    purpose: "account",
    version: "2",
    type: "address",
    network: candidate.network,
    key: `0x${candidate.derivationMode}${candidate.index}`,
    path: candidate.addressPath,
  });

const chain: AccountDataSource = {
  id: AccountDataSourceIdSchema.parse("chain"),
  supports: () => true,
  read: {
    accountStatus: async ({ descriptor }) => ({
      used: descriptor.key === "0x0",
      gate: null,
    }),
  },
};

const intentDefinition: AccountDiscoveryIntentPlatformDefinition = {
  ...createScanAccountsIntentDefinition<DiscoveredAccount>(),
  component: () => null,
};

const connection = { sessionId: "session" } as unknown as DeviceConnectionResult;
const context = {} as DeviceExtractedContext;

/** Runs the intent the way the executor does: the job on the session, its states to the listeners. */
function execute(intent: AccountDiscoveryIntent) {
  return intent
    .job({
      deviceConnectionResult: connection,
      deviceExtractedContext: context,
      input: intent.input,
      onResult: result => intent.onResult?.(result),
    })
    .subscribe({
      next: state => intent.onJobStateChanged?.(state),
      complete: () => intent.onJobComplete?.(),
    });
}

function setup(inputs: Partial<AccountDiscoveryInputs> = {}) {
  const store = configureStore({
    reducer: { noop: (state: null = null) => state },
    middleware: getDefaultMiddleware =>
      getDefaultMiddleware({ thunk: { extraArgument: accountDataExtra([chain]) } }),
  });
  const wrapper = ({ children }: PropsWithChildren) => (
    <Provider store={store}>{children}</Provider>
  );
  const createDerive = jest.fn((_connection: DeviceConnectionResult) => derive);
  const initialProps: AccountDiscoveryInputs = {
    currencies: [{ id: "ethereum", name: "Ethereum" }],
    intentDefinition,
    createDerive,
    ...inputs,
  };
  return { ...renderHook(useAccountDiscoveryToolState, { wrapper, initialProps }), createDerive };
}

async function scanToEnd(inputs: Partial<AccountDiscoveryInputs> = {}) {
  const hook = setup(inputs);
  act(() => hook.result.current.toolProps.onScan("ethereum"));
  const run = hook.result.current.run;
  if (!run) throw new Error("no run");
  act(() => void execute(run.intent));
  await waitFor(() => expect(hook.result.current.toolProps.state.status).toBe("done"));
  return hook;
}

describe("useAccountDiscoveryToolState", () => {
  it("runs a scan as a Device Intent on the currency's app", () => {
    const { result } = setup();
    expect(result.current.run).toBeNull();
    act(() => result.current.toolProps.onScan("ethereum"));
    expect(result.current.run?.currencyId).toBe("ethereum");
    expect(result.current.toolProps.state.status).toBe("scanning");
  });

  it("derives on the session the executor opened, and lists what it finds with its cost", async () => {
    const { result, createDerive } = await scanToEnd();
    expect(createDerive).toHaveBeenCalledWith(connection);
    const rows = result.current.toolProps.state.rows.map(({ derivationMode, index, used }) => [
      derivationMode,
      index,
      used,
    ]);
    expect(rows).toContainEqual(["", 0, true]);
    expect(rows).toContainEqual(["", 1, false]);
    const { counters } = result.current.toolProps.state;
    expect(counters.statusReads).toBeGreaterThan(0);
    expect(counters.derivations).toBe(counters.statusReads);
    expect(result.current.run).toBeNull();
  });

  it("applies the env scan rules of the legacy scan", async () => {
    const byDefault = (await scanToEnd()).result.current.toolProps.state.counters.derivations;
    const { result } = await scanToEnd({ scanRules: () => ({ keychainObservableRange: 5 }) });
    expect(result.current.toolProps.state.counters.derivations).toBeGreaterThan(byDefault);
  });

  it("lists only a retry's accounts once the executor retries the job", async () => {
    const { result } = setup();
    act(() => result.current.toolProps.onScan("ethereum"));
    const run = result.current.run;
    if (!run) throw new Error("no run");
    act(() => void execute(run.intent));
    await waitFor(() => expect(result.current.toolProps.state.status).toBe("done"));
    act(() => run.intent.onJobStateChanged?.({ type: "scanning", items: [], stop: jest.fn() }));
    expect(result.current.toolProps.state).toMatchObject({ status: "scanning", rows: [] });
    expect(result.current.toolProps.state.elapsedMs).toBeUndefined();
  });

  it("keeps the scan running while the device is disconnected, the executor retrying it", () => {
    const { result } = setup();
    act(() => result.current.toolProps.onScan("ethereum"));
    const run = result.current.run;
    act(() =>
      run?.intent.onJobError?.(
        Object.assign(new Error("Device disconnected"), { _tag: "DisconnectError" }),
      ),
    );
    expect(result.current.run).toBe(run);
    expect(result.current.toolProps.state).toMatchObject({
      status: "scanning",
      error: "Device disconnected",
    });
  });

  it.each([
    [
      "the job fails",
      (hook: ReturnType<typeof setup>, error: Error) =>
        hook.result.current.run?.intent.onJobError?.(error),
    ],
    [
      "the executor cannot start",
      (hook: ReturnType<typeof setup>, error: Error) => hook.result.current.onRunFailed(error),
    ],
  ])("ends the scan with the error when %s", (_, failWith) => {
    const hook = setup();
    act(() => hook.result.current.toolProps.onScan("ethereum"));
    act(() => void failWith(hook, new Error("boom")));
    expect(hook.result.current.run).toBeNull();
    expect(hook.result.current.toolProps.state).toMatchObject({ status: "error", error: "boom" });
  });

  it("shows a device error's tag when it has no message", () => {
    const hook = setup();
    act(() => hook.result.current.toolProps.onScan("ethereum"));
    act(() => hook.result.current.onRunFailed({ _tag: "SendApduTimeoutError" }));
    expect(hook.result.current.toolProps.state).toMatchObject({
      status: "error",
      error: "SendApduTimeoutError",
    });
  });

  it("keeps the executor on a disconnect while it opens the app, for its retry", () => {
    const { result } = setup();
    act(() => result.current.toolProps.onScan("ethereum"));
    const run = result.current.run;
    act(() =>
      result.current.onRunFailed(
        Object.assign(new Error("disconnected"), { _tag: "DisconnectError" }),
      ),
    );
    expect(result.current.run).toBe(run);
    expect(result.current.toolProps.state.status).toBe("scanning");
  });

  it("stops the scan when the user stops it or closes the executor", () => {
    const { result } = setup();
    act(() => result.current.toolProps.onScan("ethereum"));
    act(() => result.current.onRunCancelled());
    expect(result.current.run).toBeNull();
    expect(result.current.toolProps.state.status).toBe("stopped");
  });
});
