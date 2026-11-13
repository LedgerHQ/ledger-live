import React, { type PropsWithChildren } from "react";
import { act, renderHook, waitFor } from "@testing-library/react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import { accountDataExtra, type AccountDataSource } from "@domain/api-account-data";
import { AccountDataSourceIdSchema } from "@domain/entity-account-data";
import { AccountDescriptorSchema } from "@domain/entity-account-descriptor";
import type { DeriveAccount } from "@features/platform-account-discovery";
import {
  accountDiscoveryIntentDefinition,
  type AccountDiscoveryIntent,
  type AccountDiscoveryIntentPlatformDefinition,
} from "@features/platform-account-discovery-intent";
import type {
  DeviceConnectionResult,
  DeviceExtractedContext,
} from "@features/platform-device-intent";
import {
  useAccountDiscoveryToolState,
  type AccountDiscoveryInputs,
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
  ...accountDiscoveryIntentDefinition,
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
  act(() => hook.result.current.toolProps.onScan("ethereum", { window: 1, lookahead: 1 }));
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
    act(() => result.current.toolProps.onScan("ethereum", { window: 1, lookahead: 1 }));
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
    act(() => result.current.toolProps.onScan("ethereum", { window: 1, lookahead: 1 }));
    const run = result.current.run;
    if (!run) throw new Error("no run");
    act(() => void execute(run.intent));
    await waitFor(() => expect(result.current.toolProps.state.status).toBe("done"));
    act(() => run.intent.onJobStateChanged?.({ type: "scanning", discovered: [] }));
    expect(result.current.toolProps.state).toMatchObject({ status: "scanning", rows: [] });
  });

  it("stops the scan when the user stops it or closes the executor", () => {
    const { result } = setup();
    act(() => result.current.toolProps.onScan("ethereum", { window: 1, lookahead: 1 }));
    act(() => result.current.onRunCancelled());
    expect(result.current.run).toBeNull();
    expect(result.current.toolProps.state.status).toBe("stopped");
  });
});
