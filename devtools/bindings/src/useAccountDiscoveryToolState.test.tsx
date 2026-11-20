import React, { type PropsWithChildren } from "react";
import { act, renderHook } from "@testing-library/react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import { accountDataExtra, type AccountDataSource } from "@domain/api-account-data";
import { AccountDataSourceIdSchema } from "@domain/entity-account-data";
import { concat, concatMap, from, throwError } from "rxjs";
import type { DiscoveredRow } from "@devtools/account-discovery";
import { AccountDescriptorSchema, type AccountDescriptor } from "@domain/entity-account-descriptor";
import { CryptoCurrencyIdSchema } from "@domain/entity-currency-crypto";
import type {
  AccountCompletionEvent,
  CompleteAccounts,
  DeriveAccount,
  DiscoveredAccount,
  NeedsCompletion,
} from "@features/platform-account-discovery";
import type {
  DeviceConnectionResult,
  DeviceExtractedContext,
  Intent,
} from "@features/platform-device-intent";
import { createScanAccountsIntentDefinition } from "@features/platform-intent-scan-accounts";
import {
  accountCompletionIntentDefinition,
  useAccountDiscoveryToolState,
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
function execute<JobState, Input, Result>(intent: Intent<JobState, Input, undefined, Result>) {
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

const runToEnd = <JobState, Input, Result>(intent: Intent<JobState, Input, undefined, Result>) =>
  act(() => new Promise<void>(resolve => void execute(intent).add(resolve)));

const disconnectAfterFirstAccount: DeriveAccount = async (candidate, signal) => {
  if (candidate.index > 0) throw Object.assign(new Error("gone"), { _tag: "DisconnectError" });
  return derive(candidate, signal);
};

const SECRET = "secretViewKey";

/** The device approves the first account and refuses the others; the completed key carries a secret. */
const approveFirst: CompleteAccounts = selected =>
  concat(
    from(selected.map(source => ({ source, state: { type: "waiting" as const } }))),
    from(selected).pipe(
      concatMap(source => {
        const settled: AccountCompletionEvent =
          source.key === "0x0"
            ? {
                source,
                state: { type: "completed", descriptor: { ...source, key: `0x0.${SECRET}` } },
              }
            : { source, state: { type: "refused" } };
        return from([{ source, state: { type: "awaiting-approval" } } as const, settled]);
      }),
    ),
  );

type SetupOptions = {
  needsCompletion?: NeedsCompletion;
  isAdded?: (descriptor: AccountDescriptor) => boolean;
  notAddableReason?: (descriptor: AccountDescriptor) => string | undefined;
};

function setup({
  needsCompletion = () => true,
  isAdded = () => false,
  notAddableReason = () => undefined,
}: SetupOptions = {}) {
  const store = configureStore({
    reducer: { noop: (state: null = null) => state },
    middleware: getDefaultMiddleware =>
      getDefaultMiddleware({ thunk: { extraArgument: accountDataExtra([chain]) } }),
  });
  const wrapper = ({ children }: PropsWithChildren) => (
    <Provider store={store}>{children}</Provider>
  );
  const createDerive = jest.fn((_connection: DeviceConnectionResult) => derive);
  const createComplete = jest.fn((_connection: DeviceConnectionResult) => approveFirst);
  const addAccounts = jest.fn(async (_descriptors: readonly AccountDescriptor[]) => undefined);
  const hook = renderHook(useAccountDiscoveryToolState, {
    wrapper,
    initialProps: {
      currencies: [{ id: ethereum, name: "Ethereum" }],
      intentDefinition: {
        ...createScanAccountsIntentDefinition<DiscoveredAccount>(),
        component: () => null,
      },
      createDerive,
      completion: {
        intentDefinition: { ...accountCompletionIntentDefinition, component: () => null },
        createComplete,
        needsCompletion,
      },
      isAdded,
      notAddableReason,
      addAccounts,
    },
  });
  act(() => hook.result.current.toolProps.onScan(ethereum));
  const run = hook.result.current.run;
  if (run?.kind !== "scan") throw new Error("no scan run");
  return { ...hook, run, createDerive, createComplete, addAccounts };
}

/** Scans, selects both accounts found, and starts their completion. */
async function completeBoth(options?: SetupOptions) {
  const scanned = setup(options);
  await runToEnd(scanned.run.intent);
  const [first, second] = scanned.result.current.toolProps.state.rows;
  act(() => scanned.result.current.toolProps.onToggle(first.key));
  act(() => scanned.result.current.toolProps.onToggle(second.key));
  act(() => scanned.result.current.toolProps.onComplete());
  const completing = scanned.result.current.run;
  if (completing?.kind !== "complete") throw new Error("no completion run");
  return { ...scanned, completing };
}

const holdsSecond = (descriptor: AccountDescriptor) => descriptor.key === "0x1";

const completionOf = (rows: readonly DiscoveredRow[]) =>
  rows.map(({ index, added, completion }) => ({ index, added, completion }));

describe("useAccountDiscoveryToolState", () => {
  it("derives on the session the executor opened, and lists what it finds with its cost", async () => {
    const { result, run, createDerive } = setup();
    expect(result.current.toolProps.state.status).toBe("scanning");
    await runToEnd(run.intent);
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
    await runToEnd(run.intent);
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

  it("keeps a new scan when a closed run reports late", async () => {
    const { result, run } = setup();
    act(() => result.current.onRunCancelled());
    act(() => result.current.toolProps.onScan(ethereum));
    const next = result.current.run;
    act(() => run.intent.onJobError?.(new Error("late")));
    await runToEnd(run.intent);
    expect(result.current.run).toBe(next);
    expect(result.current.toolProps.state.status).toBe("scanning");
  });

  describe("completion and add", () => {
    it("completes the selected accounts on a fresh run, showing each state and never the completed key", async () => {
      const { result, completing, createComplete } = await completeBoth();
      expect(result.current.toolProps.state.completion.status).toBe("completing");
      await runToEnd(completing.intent);
      expect(createComplete).toHaveBeenCalledWith(connection);
      expect(result.current.run).toBeNull();
      const { state } = result.current.toolProps;
      expect(state.completion.status).toBe("done");
      expect(completionOf(state.rows)).toEqual([
        { index: 0, added: false, completion: "completed" },
        { index: 1, added: false, completion: "refused" },
      ]);
      expect(state.selection).toEqual({ completable: 1, addable: 1 });
      expect(JSON.stringify(result.current.toolProps)).not.toContain(SECRET);
    });

    it("asks a refused account again on a new click, never the completed one", async () => {
      const { result, completing, createComplete } = await completeBoth();
      await runToEnd(completing.intent);
      let asked: readonly AccountDescriptor[] = [];
      createComplete.mockReturnValueOnce(selected => {
        asked = selected;
        return approveFirst(selected);
      });
      act(() => result.current.toolProps.onComplete());
      const again = result.current.run;
      if (again?.kind !== "complete") throw new Error("no completion run");
      await runToEnd(again.intent);
      expect(asked.map(({ key }) => key)).toEqual(["0x1"]);
      expect(completionOf(result.current.toolProps.state.rows)[1].completion).toBe("refused");
    });

    it("keeps the selected accounts it did not add", async () => {
      const { result, completing, addAccounts } = await completeBoth();
      await runToEnd(completing.intent);
      await act(async () => result.current.toolProps.onAdd());
      expect(addAccounts).toHaveBeenCalledTimes(1);
      expect(result.current.toolProps.state.rows.map(({ selected }) => selected)).toEqual([
        false,
        true,
      ]);
    });

    it("adds the completed accounts and the ready ones, skipping those the app holds", async () => {
      const { result, completing, addAccounts } = await completeBoth({ isAdded: holdsSecond });
      await runToEnd(completing.intent);
      expect(completionOf(result.current.toolProps.state.rows)).toEqual([
        { index: 0, added: false, completion: "completed" },
        { index: 1, added: true, completion: undefined },
      ]);
      await act(async () => result.current.toolProps.onAdd());
      expect(addAccounts).toHaveBeenCalledWith([expect.objectContaining({ key: `0x0.${SECRET}` })]);
      expect(result.current.toolProps.state.notice).toBe("Added 1 account");
    });

    it("flags an account the app cannot add from here, and leaves it out of the selection", async () => {
      const { result, run, addAccounts } = setup({
        needsCompletion: () => false,
        notAddableReason: descriptor =>
          descriptor.key === "0x1" ? "needs its own add flow" : undefined,
      });
      await runToEnd(run.intent);
      const [first, second] = result.current.toolProps.state.rows;
      act(() => result.current.toolProps.onToggle(first.key));
      act(() => result.current.toolProps.onToggle(second.key));
      expect(result.current.toolProps.state.rows[1].notAddable).toBe("needs its own add flow");
      expect(result.current.toolProps.state.selection).toEqual({ completable: 0, addable: 1 });
      await act(async () => result.current.toolProps.onAdd());
      expect(addAccounts).toHaveBeenCalledWith([expect.objectContaining({ key: "0x0" })]);
    });

    it("adds an account whose family has no completion step as discovered", async () => {
      const { result, run, addAccounts } = setup({ needsCompletion: () => false });
      await runToEnd(run.intent);
      act(() => result.current.toolProps.onToggle(result.current.toolProps.state.rows[0].key));
      expect(result.current.toolProps.state.selection).toEqual({ completable: 0, addable: 1 });
      await act(async () => result.current.toolProps.onAdd());
      expect(addAccounts).toHaveBeenCalledWith([expect.objectContaining({ key: "0x0" })]);
    });

    it("keeps the executor on a disconnect, and its retry prompts only the accounts not settled", async () => {
      const { result, completing, createComplete } = await completeBoth();
      const disconnect = Object.assign(new Error("gone"), { _tag: "DisconnectError" });
      createComplete.mockReturnValueOnce(selected =>
        concat(
          approveFirst(selected.slice(0, 1)),
          throwError(() => disconnect),
        ),
      );
      await runToEnd(completing.intent);
      expect(result.current.run).toBe(completing);
      let retried: readonly AccountDescriptor[] = [];
      createComplete.mockReturnValueOnce(selected => {
        retried = selected;
        return approveFirst(selected);
      });
      await runToEnd(completing.intent);
      expect(retried.map(({ key }) => key)).toEqual(["0x1"]);
      expect(completionOf(result.current.toolProps.state.rows)).toEqual([
        { index: 0, added: false, completion: "completed" },
        { index: 1, added: false, completion: "refused" },
      ]);
    });

    it("fails the accounts left on another error, keeping the approved ones", async () => {
      const { result, completing, createComplete } = await completeBoth();
      createComplete.mockReturnValueOnce(selected =>
        concat(
          approveFirst(selected.slice(0, 1)),
          throwError(() => new Error("app closed")),
        ),
      );
      await runToEnd(completing.intent);
      expect(result.current.run).toBeNull();
      const { state } = result.current.toolProps;
      expect(state.completion).toEqual({ status: "error", error: "app closed" });
      expect(completionOf(state.rows)).toEqual([
        { index: 0, added: false, completion: "completed" },
        { index: 1, added: false, completion: "failed" },
      ]);
      expect(state.rows[1].completionError).toBe("app closed");
    });
  });
});
