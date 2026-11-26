/**
 * @jest-environment jsdom
 */
import { act, waitFor } from "@testing-library/react";
import { mockKeyRingState } from "@domain/entity-key-ring/slice.mock";
import { KeyRingNotAllowedError, commitKeyRingTree } from "@features/platform-key-ring";
import { fakeKeyRingClient } from "@features/platform-key-ring/testing";
import { LedgerSyncMembersUnresolvedError } from "../errors";
import { fakeStream, member, newTreeUpdate } from "../__tests__/fixtures";
import { renderLedgerSyncHook } from "../__tests__/harness";
import { useLedgerSyncMembers } from "./useLedgerSyncMembers";

afterEach(() => jest.restoreAllMocks());

describe("useLedgerSyncMembers", () => {
  it("should list the members of the key tree", async () => {
    const members = [member("member-1"), member("member-2")];
    const client = fakeKeyRingClient({
      openStream: () => fakeStream(),
      listMembers: jest.fn().mockResolvedValue(members),
    });
    const { result } = renderLedgerSyncHook(() =>
      useLedgerSyncMembers({ client, onError: jest.fn() }),
    );

    expect(result.current.isLoading).toBe(true);
    await waitFor(() => expect(result.current.data).toEqual(members));
    expect(result.current.isLoading).toBe(false);
    expect(result.current.isError).toBe(false);
    expect(result.current.isFetchedAfterMount).toBe(true);
  });

  it("should not list the members while the instance is not a member", () => {
    const listMembers = jest.fn();
    const client = fakeKeyRingClient({ openStream: () => null, listMembers });
    const { result } = renderLedgerSyncHook(
      () => useLedgerSyncMembers({ client, onError: jest.fn() }),
      { trustchain: mockKeyRingState({ trustchain: null }) },
    );

    expect(listMembers).not.toHaveBeenCalled();
    expect(result.current.data).toBeUndefined();
    expect(result.current.isPending).toBe(true);
    expect(result.current.isFetching).toBe(false);
  });

  it("should route a failure to onError", async () => {
    const error = new KeyRingNotAllowedError();
    const onError = jest.fn();
    const client = fakeKeyRingClient({
      openStream: () => fakeStream(),
      listMembers: jest.fn().mockRejectedValue(error),
    });
    const { result } = renderLedgerSyncHook(() => useLedgerSyncMembers({ client, onError }));

    await waitFor(() => expect(onError).toHaveBeenCalledWith(error));
    expect(result.current.error).toBe(error);
    expect(result.current.isError).toBe(true);
  });

  it("should fail with the unresolved members error on a refetch without a member key", async () => {
    const onError = jest.fn();
    const listMembers = jest.fn();
    const client = fakeKeyRingClient({ openStream: () => null, listMembers });
    const { result } = renderLedgerSyncHook(() => useLedgerSyncMembers({ client, onError }), {
      trustchain: mockKeyRingState({ memberCredentials: null }),
    });

    await act(() => result.current.refetch());

    await waitFor(() => expect(onError).toHaveBeenCalled());
    const [error] = onError.mock.calls[0];
    expect(error).toBeInstanceOf(LedgerSyncMembersUnresolvedError);
    expect(String(error)).toBe('Error: ["useGetMembers",null] data is undefined');
    expect(listMembers).not.toHaveBeenCalled();
    expect(result.current.isError).toBe(true);
  });

  it("should not query the members without a member key until a refetch", () => {
    const onError = jest.fn();
    const client = fakeKeyRingClient({ openStream: () => null, listMembers: jest.fn() });
    const { result } = renderLedgerSyncHook(() => useLedgerSyncMembers({ client, onError }), {
      trustchain: mockKeyRingState({ memberCredentials: null }),
    });

    expect(result.current.isFetching).toBe(false);
    expect(onError).not.toHaveBeenCalled();
  });

  it("should list the members again after a key rotation", async () => {
    const listMembers = jest.fn().mockResolvedValue([member("member-1")]);
    let stream = fakeStream("mock-root-id", "m/0'/16'/0'");
    const client = fakeKeyRingClient({ openStream: () => stream, listMembers });
    const { store } = renderLedgerSyncHook(() =>
      useLedgerSyncMembers({ client, onError: jest.fn() }),
    );
    await waitFor(() => expect(listMembers).toHaveBeenCalledTimes(1));

    stream = fakeStream("rotated-root", "m/0'/16'/1'");
    act(() => {
      store.dispatch(commitKeyRingTree(newTreeUpdate("rotated-root")));
    });

    await waitFor(() => expect(listMembers).toHaveBeenCalledTimes(2));
  });
});
