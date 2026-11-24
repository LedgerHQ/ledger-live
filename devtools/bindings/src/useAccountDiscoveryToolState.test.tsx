import React, { type PropsWithChildren } from "react";
import { act, renderHook } from "@testing-library/react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import { accountDataExtra, type AccountDataSource } from "@domain/api-account-data";
import { AccountDataSourceIdSchema } from "@domain/entity-account-data";
import { AccountDescriptorSchema } from "@domain/entity-account-descriptor/descriptor";
import { CryptoCurrencyIdSchema } from "@domain/entity-currency-crypto";
import type { DeriveAccount, DiscoveredAccount } from "@features/platform-account-discovery";
import type {
  DeviceConnectionResult,
  DeviceExtractedContext,
} from "@features/platform-device-intent";
import { createScanAccountsIntentDefinition } from "@features/platform-intent-scan-accounts";
import {
  useAccountDiscoveryToolState,
  type AccountDiscoveryIntent,
} from "./useAccountDiscoveryToolState";

const ethereum = CryptoCurrencyIdSchema.parse("ethereum");

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
    accountStatus: async ({ descriptor }) => ({ used: descriptor.key === "0x0", gate: null }),
  },
};

const connection: DeviceConnectionResult = {
  dmk: {} as DeviceConnectionResult["dmk"],
  sessionId: "session",
  connectedDevice: {} as DeviceConnectionResult["connectedDevice"],
  compatDeviceId: "compat",
  compatDeviceName: "Test device",
  compatDeviceWired: true,
};

/** Runs the intent the way the executor does: the job on the session, its states to the listeners. */
function execute(intent: AccountDiscoveryIntent) {
  return intent
    .job({
      deviceConnectionResult: connection,
      deviceExtractedContext: {} as DeviceExtractedContext,
      input: intent.input,
      onResult: result => intent.onResult?.(result),
    })
    .subscribe({
      next: state => intent.onJobStateChanged?.(state),
      error: error => intent.onJobError?.(error),
    });
}

const scanToEnd = (intent: AccountDiscoveryIntent) =>
  act(() => new Promise<void>(resolve => void execute(intent).add(resolve)));

const disconnectAfterFirstAccount: DeriveAccount = async (candidate, signal) => {
  if (candidate.index > 0) throw Object.assign(new Error("gone"), { _tag: "DisconnectError" });
  return derive(candidate, signal);
};

function setup() {
  const store = configureStore({
    reducer: { noop: (state: null = null) => state },
    middleware: getDefaultMiddleware =>
      getDefaultMiddleware({ thunk: { extraArgument: accountDataExtra([chain]) } }),
  });
  const wrapper = ({ children }: PropsWithChildren) => (
    <Provider store={store}>{children}</Provider>
  );
  const createDerive = jest.fn((_connection: DeviceConnectionResult) => derive);
  const hook = renderHook(useAccountDiscoveryToolState, {
    wrapper,
    initialProps: {
      currencies: [{ id: ethereum, name: "Ethereum" }],
      intentDefinition: {
        ...createScanAccountsIntentDefinition<DiscoveredAccount>(),
        component: () => null,
      },
      createDerive,
    },
  });
  act(() => hook.result.current.toolProps.onScan(ethereum));
  const run = hook.result.current.run;
  if (!run) throw new Error("no run");
  return { ...hook, run, createDerive };
}

describe("useAccountDiscoveryToolState", () => {
  it("derives on the session the executor opened, and lists what it finds with its cost", async () => {
    const { result, run, createDerive } = setup();
    expect(result.current.toolProps.state.status).toBe("scanning");
    await scanToEnd(run.intent);
    expect(result.current.toolProps.state.status).toBe("done");
    expect(createDerive).toHaveBeenCalledWith(connection);
    const { rows, counters } = result.current.toolProps.state;
    expect(rows.map(({ derivationMode, index, used }) => [derivationMode, index, used])).toEqual([
      ["", 0, true],
      ["", 1, false],
    ]);
    expect(counters).toEqual({ derivations: 14, statusReads: 14 });
    expect(result.current.run).toBeNull();
  });

  it("restarts the list when the executor retries the scan after a disconnect", async () => {
    const { result, run, createDerive } = setup();
    createDerive.mockReturnValueOnce(disconnectAfterFirstAccount);
    await scanToEnd(run.intent);
    expect(result.current.run).toBe(run);
    expect(result.current.toolProps.state.status).toBe("scanning");
    let retry: ReturnType<typeof execute> | undefined;
    act(() => {
      retry = execute(run.intent);
    });
    expect(result.current.toolProps.state).toMatchObject({
      status: "scanning",
      rows: [],
      counters: { derivations: 0, statusReads: 0 },
    });
    retry?.unsubscribe();
  });

  it("ends the scan with the error when the executor cannot start", () => {
    const { result } = setup();
    act(() => result.current.onRunFailed({ _tag: "SendApduTimeoutError" }));
    expect(result.current.run).toBeNull();
    expect(result.current.toolProps.state).toMatchObject({
      status: "error",
      error: "SendApduTimeoutError",
    });
  });

  it("stops the scan when the user closes the executor", () => {
    const { result } = setup();
    act(() => result.current.onRunCancelled());
    expect(result.current.run).toBeNull();
    expect(result.current.toolProps.state.status).toBe("stopped");
  });
});
