import React, { type PropsWithChildren } from "react";
import { act, renderHook, waitFor } from "@testing-library/react";
import { Provider } from "react-redux";
import { configureStore, createAction, type UnknownAction } from "@reduxjs/toolkit";
import { DeviceModelId } from "@ledgerhq/device-management-kit";
import {
  addMemberIntentDefinition,
  removeMemberIntentDefinition,
  TrustchainMemberId,
  type LedgerSyncJobState,
} from "@features/platform-intent-wallet-sync";
import {
  TrustchainResultType,
  type MemberCredentials,
  type Trustchain,
  type TrustchainMember,
} from "@ledgerhq/ledger-key-ring-protocol/types";
import {
  useIntentWalletSyncToolState,
  type IntentWalletSyncToolStateParams,
} from "./useIntentWalletSyncToolState";

const MEMBER_CREDENTIALS: MemberCredentials = { pubkey: "pubkey", privatekey: "privatekey" };
const TRUSTCHAIN: Trustchain = {
  rootId: "root-id",
  applicationPath: "m/0'/16'/0'",
  walletSyncEncryptionKey: "key",
};
const ROTATED: Trustchain = { ...TRUSTCHAIN, walletSyncEncryptionKey: "rotated" };
const MEMBERS: TrustchainMember[] = [
  { id: "member-1", name: "Desktop", permissions: 1 },
  { id: "member-2", name: "Mobile", permissions: 1 },
];

interface TrustchainStore {
  trustchain: Trustchain | null;
  memberCredentials: MemberCredentials | null;
}

const setTrustchain = createAction<Trustchain>("SET_TRUSTCHAIN");

function trustchainReducer(state: TrustchainStore | undefined, action: UnknownAction) {
  const current = state ?? { trustchain: null, memberCredentials: null };
  return setTrustchain.match(action) ? { ...current, trustchain: action.payload } : current;
}

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
    createSessionSdk: jest.fn(),
    sdk: { getMembers: jest.fn().mockResolvedValue(MEMBERS) },
    setTrustchain,
  } satisfies IntentWalletSyncToolStateParams;
}

function renderTool(stored: Partial<TrustchainStore> = {}) {
  const params = buildParams();
  const store = configureStore({
    reducer: { trustchain: trustchainReducer },
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

  it("should run add member, log its states, store the trustchain and reload members", async () => {
    const { result, store, params } = renderTool();

    act(() => result.current.toolProps.onAddMember());

    const run = result.current.run;
    expect(run?.operation).toBe("add-member");
    expect(run?.intent.input).toEqual({
      memberCredentials: MEMBER_CREDENTIALS,
      currentTrustchain: TRUSTCHAIN,
      createSessionSdk: params.createSessionSdk,
    });
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
        ? run.intent.onResult?.({ type: TrustchainResultType.created, trustchain: ROTATED })
        : undefined,
    );
    emit(run, { type: "completed" });
    act(() => run?.intent.onJobComplete?.());

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
    expect(params.sdk.getMembers).toHaveBeenCalledWith(ROTATED, MEMBER_CREDENTIALS);
  });

  it("should not pass a current trustchain when the instance has none", () => {
    const { result } = renderTool({ trustchain: null });

    act(() => result.current.toolProps.onAddMember());

    expect(result.current.run?.intent.input).not.toHaveProperty("currentTrustchain");
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

  it("should remove a loaded member and store the rotated trustchain", async () => {
    const { result, store, params } = renderTool();

    act(() => result.current.toolProps.onRefreshMembers());
    await waitFor(() => expect(result.current.toolProps.members).toHaveLength(2));

    act(() => result.current.toolProps.onRemoveMember(TrustchainMemberId.parse("member-2")));
    const run = result.current.run;
    expect(run?.operation).toBe("remove-member");
    expect(run?.intent.input).toMatchObject({ trustchain: TRUSTCHAIN, member: MEMBERS[1] });

    act(() => (run?.operation === "remove-member" ? run.intent.onResult?.(ROTATED) : undefined));
    emit(run, { type: "completed" });
    act(() => run?.intent.onJobComplete?.());

    expect(store.getState().trustchain.trustchain).toEqual(ROTATED);
    expect(result.current.toolProps.log.at(-1)).toMatchObject({
      operation: "remove-member",
      jobState: "completed",
      detail: "root-id",
    });
    await waitFor(() =>
      expect(params.sdk.getMembers).toHaveBeenLastCalledWith(ROTATED, MEMBER_CREDENTIALS),
    );
  });

  it("should neither list nor remove this instance's own member", async () => {
    const { result, params } = renderTool();
    const self: TrustchainMember = { id: MEMBER_CREDENTIALS.pubkey, name: "This", permissions: 1 };
    params.sdk.getMembers.mockResolvedValue([...MEMBERS, self]);

    act(() => result.current.toolProps.onRefreshMembers());
    await waitFor(() => expect(result.current.toolProps.members).toHaveLength(2));
    act(() => result.current.toolProps.onRemoveMember(TrustchainMemberId.parse(self.id)));

    expect(result.current.toolProps.members?.map(({ id }) => id)).not.toContain(self.id);
    expect(result.current.run).toBeNull();
  });

  it("should keep the latest members when an older fetch settles last", async () => {
    const { result, params } = renderTool();
    const older = createDeferred<TrustchainMember[]>();
    params.sdk.getMembers
      .mockImplementationOnce(() => older.promise)
      .mockResolvedValueOnce([MEMBERS[0]]);

    act(() => result.current.toolProps.onRefreshMembers());
    act(() => result.current.toolProps.onRefreshMembers());
    await waitFor(() => expect(result.current.toolProps.members).toHaveLength(1));
    await act(async () => older.resolve(MEMBERS));

    expect(result.current.toolProps.members).toEqual([{ id: "member-1", name: "Desktop" }]);
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
