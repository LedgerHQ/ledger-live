import React, { type PropsWithChildren } from "react";
import { act, renderHook, waitFor } from "@testing-library/react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import { DeviceModelId } from "@ledgerhq/device-management-kit";
import {
  addMemberIntentDefinition,
  createLedgerSyncResultOrder,
  KeyRingMemberIdSchema,
  KeyRingMemberSchema,
  removeMemberIntentDefinition,
  selectKeyRingSession,
  type KeyRingMember,
  type KeyRingSession,
  type KeyRingTreeUpdate,
  type LedgerSyncJobState,
} from "@features/platform-key-ring";
import { fakeKeyRingClient } from "@features/platform-key-ring/testing";
import {
  keyRingMemberKeySet,
  keyRingSlice,
  keyRingTreeSet,
  type KeyRingState,
} from "@domain/entity-key-ring";
import {
  mockKeyRingMemberKeyRecord,
  mockKeyRingTreeRecord,
} from "@domain/entity-key-ring/schema.mock";
import {
  useIntentWalletSyncToolState,
  type IntentWalletSyncToolStateParams,
} from "./useIntentWalletSyncToolState";

const MEMBER_CREDENTIALS = mockKeyRingMemberKeyRecord();
// A Ledger Sync reset rotates the member key.
const OTHER_CREDENTIALS = mockKeyRingMemberKeyRecord({
  pubkey: `03${"c".repeat(64)}`,
  privatekey: "d".repeat(64),
});
const TRUSTCHAIN = mockKeyRingTreeRecord({ rootId: "root-id" });
const ROTATED = { ...TRUSTCHAIN, walletSyncEncryptionKey: "rotated" };
const ROTATED_UPDATE: KeyRingTreeUpdate = { kind: "KeyRingTreeUpdate" };
const MEMBERS = KeyRingMemberSchema.array().parse([
  { id: "member-1", name: "Desktop" },
  { id: "member-2", name: "Mobile" },
]);

function createDeferred<T>() {
  const settle: { resolve?: (value: T) => void } = {};
  const promise = new Promise<T>(resolve => {
    settle.resolve = resolve;
  });
  return { promise, resolve: (value: T) => settle.resolve?.(value) };
}

function buildParams() {
  return {
    addMemberIntentDefinition: { ...addMemberIntentDefinition, component: () => null },
    removeMemberIntentDefinition: { ...removeMemberIntentDefinition, component: () => null },
    resultOrder: createLedgerSyncResultOrder(),
    keyRing: Object.assign(fakeKeyRingClient(), {
      listMembers: jest.fn<Promise<KeyRingMember[]>, [KeyRingSession]>().mockResolvedValue(MEMBERS),
    }),
    commitKeyRingTree: jest.fn((_update: KeyRingTreeUpdate) => keyRingTreeSet(ROTATED)),
  } satisfies IntentWalletSyncToolStateParams;
}

function renderTool(stored: Partial<KeyRingState> = {}) {
  const params = buildParams();
  const store = configureStore({
    reducer: { trustchain: keyRingSlice.reducer },
    preloadedState: {
      trustchain: { trustchain: TRUSTCHAIN, memberCredentials: MEMBER_CREDENTIALS, ...stored },
    },
  });
  const wrapper = ({ children }: PropsWithChildren) => (
    <Provider store={store}>{children}</Provider>
  );
  const { result } = renderHook(() => useIntentWalletSyncToolState(params), { wrapper });
  return { result, store, params };
}

function emit(
  run: { intent: { onJobStateChanged?: (state: LedgerSyncJobState) => void } } | null,
  state: LedgerSyncJobState,
) {
  act(() => run?.intent.onJobStateChanged?.(state));
}

describe("useIntentWalletSyncToolState", () => {
  it("should start idle with no run, members or log", () => {
    const { result } = renderTool();

    expect(result.current.run).toBeNull();
    expect(result.current.toolProps).toMatchObject({
      status: "idle",
      hasMemberCredentials: true,
      hasTrustchain: true,
      members: null,
      log: [],
    });
  });

  it("should run add member, log its states, commit the key tree and reload members", async () => {
    const { result, store, params } = renderTool();
    const runSession = selectKeyRingSession(store.getState());

    act(() => result.current.toolProps.onAddMember());

    const run = result.current.run;
    expect(run?.operation).toBe("add-member");
    expect(run?.intent.input).toEqual({
      session: runSession,
      client: params.keyRing,
      resultOrder: params.resultOrder,
    });
    expect(run?.intent.input.session).toBe(runSession);
    expect(result.current.toolProps.status).toBe("running");

    emit(run, { type: "pending" });
    emit(run, {
      type: "awaiting-device-confirmation",
      deviceModelId: DeviceModelId.STAX,
      deviceName: "Ledger Stax",
    });
    emit(run, { type: "processing" });
    act(() =>
      run?.operation === "add-member"
        ? run.intent.onResult?.({ outcome: "created", tree: ROTATED_UPDATE })
        : undefined,
    );
    emit(run, { type: "completed" });
    act(() => run?.intent.onJobComplete?.());

    expect(params.commitKeyRingTree).toHaveBeenCalledWith(ROTATED_UPDATE);
    expect(store.getState().trustchain.trustchain).toEqual(ROTATED);
    expect(result.current.run).toBeNull();
    expect(
      result.current.toolProps.log.map(({ operation, jobState, detail }) => [
        operation,
        jobState,
        detail,
      ]),
    ).toEqual([
      ["add-member", "pending", null],
      ["add-member", "awaiting-device-confirmation", DeviceModelId.STAX],
      ["add-member", "processing", null],
      ["add-member", "completed", "created root-id"],
    ]);
    await waitFor(() =>
      expect(result.current.toolProps.members).toEqual([
        { id: "member-1", name: "Desktop" },
        { id: "member-2", name: "Mobile" },
      ]),
    );
    expect(params.keyRing.listMembers.mock.lastCall?.[0]).toBe(
      selectKeyRingSession(store.getState()),
    );
  });

  it("should pass the session alone when the instance has no key tree", () => {
    const { result, store, params } = renderTool({ trustchain: null });

    act(() => result.current.toolProps.onAddMember());

    expect(result.current.run?.intent.input).toEqual({
      session: selectKeyRingSession(store.getState()),
      client: params.keyRing,
      resultOrder: params.resultOrder,
    });
  });

  it("should log the failure reason and the refusal, without credentials", () => {
    const { result } = renderTool();

    act(() => result.current.toolProps.onAddMember());
    const run = result.current.run;
    const refusal = new Error("refused");
    refusal.name = "UserRefusedOnDevice";
    emit(run, { type: "device-rejected", error: refusal, retry: jest.fn() });
    emit(run, {
      type: "failed",
      reason: "already-secured-other-seed",
      error: new Error(MEMBER_CREDENTIALS.privatekey),
    });

    const details = result.current.toolProps.log.map(row => row.detail);
    expect(details).toEqual(["UserRefusedOnDevice", "already-secured-other-seed"]);
    expect(JSON.stringify(result.current.toolProps.log)).not.toContain(
      MEMBER_CREDENTIALS.privatekey,
    );
  });

  it("should remove a loaded member and commit the rotated key tree", async () => {
    const { result, store, params } = renderTool();
    const runSession = selectKeyRingSession(store.getState());

    act(() => result.current.toolProps.onRefreshMembers());
    await waitFor(() => expect(result.current.toolProps.members).toHaveLength(2));

    act(() => result.current.toolProps.onRemoveMember(KeyRingMemberIdSchema.parse("member-2")));
    const run = result.current.run;
    expect(run?.operation).toBe("remove-member");
    expect(run?.intent.input).toMatchObject({ member: MEMBERS[1] });
    expect(run?.intent.input.session).toBe(runSession);

    act(() =>
      run?.operation === "remove-member" ? run.intent.onResult?.(ROTATED_UPDATE) : undefined,
    );
    emit(run, { type: "completed" });
    act(() => run?.intent.onJobComplete?.());

    expect(params.commitKeyRingTree).toHaveBeenCalledWith(ROTATED_UPDATE);
    expect(store.getState().trustchain.trustchain).toEqual(ROTATED);
    expect(result.current.toolProps.log.at(-1)).toMatchObject({
      operation: "remove-member",
      jobState: "completed",
      detail: "root-id",
    });
    await waitFor(() => expect(params.keyRing.listMembers).toHaveBeenCalledTimes(2));
    expect(params.keyRing.listMembers.mock.lastCall?.[0]).toBe(
      selectKeyRingSession(store.getState()),
    );
  });

  it("should drop an add member result that arrives after Ledger Sync was reset", () => {
    const { result, store, params } = renderTool();
    act(() => result.current.toolProps.onAddMember());
    const run = result.current.run;

    act(() => {
      store.dispatch(keyRingMemberKeySet(OTHER_CREDENTIALS));
    });
    act(() =>
      run?.operation === "add-member"
        ? run.intent.onResult?.({ outcome: "created", tree: ROTATED_UPDATE })
        : undefined,
    );
    act(() => run?.intent.onJobComplete?.());

    expect(store.getState().trustchain.trustchain).toEqual(TRUSTCHAIN);
    expect(params.keyRing.listMembers).not.toHaveBeenCalled();
  });

  it("should drop a remove member result that arrives after Ledger Sync was reset", async () => {
    const { result, store, params } = renderTool();
    act(() => result.current.toolProps.onRefreshMembers());
    await waitFor(() => expect(result.current.toolProps.members).toHaveLength(2));
    act(() => result.current.toolProps.onRemoveMember(KeyRingMemberIdSchema.parse("member-2")));
    const run = result.current.run;

    act(() => {
      store.dispatch(keyRingMemberKeySet(OTHER_CREDENTIALS));
    });
    act(() =>
      run?.operation === "remove-member" ? run.intent.onResult?.(ROTATED_UPDATE) : undefined,
    );
    act(() => run?.intent.onJobComplete?.());

    expect(store.getState().trustchain.trustchain).toEqual(TRUSTCHAIN);
    expect(params.keyRing.listMembers).toHaveBeenCalledTimes(1);
  });

  it("should neither list nor remove this instance's own member", async () => {
    const { result, params } = renderTool();
    const self = KeyRingMemberSchema.parse({
      id: MEMBER_CREDENTIALS.pubkey,
      name: "This",
    });
    params.keyRing.listMembers.mockResolvedValue([...MEMBERS, self]);

    act(() => result.current.toolProps.onRefreshMembers());
    await waitFor(() => expect(result.current.toolProps.members).toHaveLength(2));
    act(() => result.current.toolProps.onRemoveMember(self.id));

    expect(result.current.toolProps.members?.map(({ id }) => id)).not.toContain(self.id);
    expect(result.current.run).toBeNull();
  });

  it("should keep the latest members when an older fetch settles last", async () => {
    const { result, params } = renderTool();
    const older = createDeferred<KeyRingMember[]>();
    params.keyRing.listMembers
      .mockImplementationOnce(() => older.promise)
      .mockResolvedValueOnce([MEMBERS[0]]);

    act(() => result.current.toolProps.onRefreshMembers());
    act(() => result.current.toolProps.onRefreshMembers());
    await waitFor(() => expect(result.current.toolProps.members).toHaveLength(1));
    await act(async () => older.resolve(MEMBERS));

    expect(result.current.toolProps.members).toEqual([{ id: "member-1", name: "Desktop" }]);
  });

  it.each([
    ["key tree", keyRingTreeSet({ ...TRUSTCHAIN, rootId: "other-root-id" })],
    ["member key", keyRingMemberKeySet(OTHER_CREDENTIALS)],
  ])("should hide members and ignore a pending fetch after a %s change", async (_, change) => {
    const { result, store, params } = renderTool();
    act(() => result.current.toolProps.onRefreshMembers());
    await waitFor(() => expect(result.current.toolProps.members).toHaveLength(2));
    const pending = createDeferred<KeyRingMember[]>();
    params.keyRing.listMembers.mockImplementationOnce(() => pending.promise);

    act(() => result.current.toolProps.onRefreshMembers());
    act(() => {
      store.dispatch(change);
    });
    expect(result.current.toolProps.members).toBeNull();
    await act(async () => pending.resolve(MEMBERS));

    expect(result.current.toolProps.members).toBeNull();
    act(() => result.current.toolProps.onRemoveMember(KeyRingMemberIdSchema.parse("member-2")));
    expect(result.current.run).toBeNull();
  });

  it("should end the run when the user closes the executor or the job errors", () => {
    const { result } = renderTool();

    act(() => result.current.toolProps.onAddMember());
    act(() => result.current.onRunCancelled());
    expect(result.current.run).toBeNull();

    act(() => result.current.toolProps.onAddMember());
    act(() =>
      result.current.run?.intent.onJobError?.(Object.assign(new Error(), { name: "Boom" })),
    );
    expect(result.current.run).toBeNull();
    expect(result.current.toolProps.log.at(-1)).toMatchObject({
      jobState: "error",
      detail: "Boom",
    });
  });

  it("should keep the executor mounted on a device disconnection", () => {
    const { result } = renderTool();
    act(() => result.current.toolProps.onAddMember());

    act(() =>
      result.current.run?.intent.onJobError?.(
        Object.assign(new Error(), { name: "Unplugged", _tag: "DisconnectError" }),
      ),
    );

    expect(result.current.run).not.toBeNull();
    expect(result.current.toolProps.log.at(-1)).toMatchObject({
      jobState: "disconnected",
      detail: "Unplugged",
    });
  });

  it("should launch nothing without member credentials", () => {
    const { result } = renderTool({ memberCredentials: null });

    act(() => result.current.toolProps.onAddMember());

    expect(result.current.run).toBeNull();
    expect(result.current.toolProps.hasMemberCredentials).toBe(false);
  });

  it("should clear the log", () => {
    const { result } = renderTool();
    act(() => result.current.toolProps.onAddMember());
    emit(result.current.run, { type: "pending" });

    act(() => result.current.toolProps.onClearLog());

    expect(result.current.toolProps.log).toEqual([]);
  });
});
