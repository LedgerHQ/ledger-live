import { act, renderHook, waitFor } from "@testing-library/react";
import { DeviceModelId } from "@ledgerhq/device-management-kit";
import {
  addMemberIntentDefinition,
  removeMemberIntentDefinition,
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

function buildParams(
  overrides: Partial<IntentWalletSyncToolStateParams> = {},
): IntentWalletSyncToolStateParams {
  return {
    addMemberIntentDefinition: { ...addMemberIntentDefinition, component: () => null },
    removeMemberIntentDefinition: { ...removeMemberIntentDefinition, component: () => null },
    createSessionSdk: jest.fn(),
    trustchain: TRUSTCHAIN,
    memberCredentials: MEMBER_CREDENTIALS,
    getMembers: jest.fn().mockResolvedValue(MEMBERS),
    onTrustchainChange: jest.fn(),
    ...overrides,
  };
}

function emit(
  run: { intent: { onJobStateChanged?: (state: LedgerSyncJobState) => void } } | null,
  state: LedgerSyncJobState,
) {
  act(() => run?.intent.onJobStateChanged?.(state));
}

describe("useIntentWalletSyncToolState", () => {
  it("should start idle with no run, members or log", () => {
    const { result } = renderHook(() => useIntentWalletSyncToolState(buildParams()));

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
    const params = buildParams();
    const { result } = renderHook(() => useIntentWalletSyncToolState(params));

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
    act(() =>
      run?.operation === "add-member"
        ? run.intent.onResult?.({ type: TrustchainResultType.created, trustchain: TRUSTCHAIN })
        : undefined,
    );
    emit(run, { type: "completed" });
    act(() => run?.intent.onJobComplete?.());

    expect(params.onTrustchainChange).toHaveBeenCalledWith(TRUSTCHAIN);
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
      ["add-member", "completed", "created root-id"],
    ]);
    await waitFor(() =>
      expect(result.current.toolProps.members).toEqual([
        { id: "member-1", name: "Desktop" },
        { id: "member-2", name: "Mobile" },
      ]),
    );
    expect(params.getMembers).toHaveBeenCalledWith(TRUSTCHAIN, MEMBER_CREDENTIALS);
  });

  it("should not pass a current trustchain when the instance has none", () => {
    const { result } = renderHook(() =>
      useIntentWalletSyncToolState(buildParams({ trustchain: null })),
    );

    act(() => result.current.toolProps.onAddMember());

    expect(result.current.run?.intent.input).not.toHaveProperty("currentTrustchain");
  });

  it("should log the failure reason and the refusal, without credentials", () => {
    const { result } = renderHook(() => useIntentWalletSyncToolState(buildParams()));

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
    const params = buildParams();
    const { result } = renderHook(() => useIntentWalletSyncToolState(params));

    act(() => result.current.toolProps.onRefreshMembers());
    await waitFor(() => expect(result.current.toolProps.members).toHaveLength(2));

    act(() => result.current.toolProps.onRemoveMember("member-2"));
    const run = result.current.run;
    expect(run?.operation).toBe("remove-member");
    expect(run?.intent.input).toMatchObject({ trustchain: TRUSTCHAIN, member: MEMBERS[1] });

    act(() => (run?.operation === "remove-member" ? run.intent.onResult?.(ROTATED) : undefined));
    emit(run, { type: "completed" });
    act(() => run?.intent.onJobComplete?.());

    expect(params.onTrustchainChange).toHaveBeenCalledWith(ROTATED);
    expect(result.current.toolProps.log.at(-1)).toMatchObject({
      operation: "remove-member",
      jobState: "completed",
      detail: "root-id",
    });
    await waitFor(() =>
      expect(params.getMembers).toHaveBeenLastCalledWith(ROTATED, MEMBER_CREDENTIALS),
    );
  });

  it("should end the run when the user closes the executor or the job errors", () => {
    const { result } = renderHook(() => useIntentWalletSyncToolState(buildParams()));

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

  it("should launch nothing without member credentials", () => {
    const { result } = renderHook(() =>
      useIntentWalletSyncToolState(buildParams({ memberCredentials: null })),
    );

    act(() => result.current.toolProps.onAddMember());

    expect(result.current.run).toBeNull();
    expect(result.current.toolProps.hasMemberCredentials).toBe(false);
  });

  it("should clear the log", () => {
    const { result } = renderHook(() => useIntentWalletSyncToolState(buildParams()));
    act(() => result.current.toolProps.onAddMember());
    emit(result.current.run, { type: "pending" });

    act(() => result.current.toolProps.onClearLog());

    expect(result.current.toolProps.log).toEqual([]);
  });
});
