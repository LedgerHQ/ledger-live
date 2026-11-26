/**
 * @jest-environment jsdom
 */
import "./jsdomEncoding";
import { renderHook, waitFor } from "@testing-library/react";
import { z } from "zod";
import type { CloudSyncDataManager } from "@shared/cloud-sync-module";
import {
  keyRingRuntimeExtra,
  KeyRingMemberRemovedError,
  KeyRingNotAllowedError,
  selectKeyRingSession,
  type KeyRingSession,
  type KeyRingStream,
} from "@features/platform-key-ring";
import { fakeKeyRingClient } from "@features/platform-key-ring/testing";
import type { KeyRingCloudSync } from "../cloudSync/keyRingCloudSync";
import { useWalletSyncWatcher, type WalletSyncFeature } from "../hooks/useWalletSyncWatcher";

const schema = z.object({ value: z.string() });
type Doc = z.infer<typeof schema>;
type State = { local: { value: string }; distant: { data: Doc | null; version: number } };

const STATE: State = { local: { value: "same" }, distant: { data: { value: "same" }, version: 1 } };
const ENABLED: WalletSyncFeature = {
  enabled: true,
  params: { watchConfig: { initialTimeout: 1 } },
};

const walletsync: CloudSyncDataManager<State["local"], string, typeof schema> = {
  schema,
  diffLocalToDistant: (local, latest) => ({
    hasChanges: local.value !== latest?.value,
    nextState: { value: local.value },
  }),
  resolveIncrementalUpdate: async () => ({ hasChanges: false }),
  applyUpdate: local => local,
};

function getState() {
  return STATE;
}
function localStateSelector(state: State) {
  return state.local;
}
function latestDistantStateSelector(state: State) {
  return state.distant.data;
}
function latestWalletStateSelector(state: State) {
  return state.distant;
}
async function saveUpdate() {}

// A member instance: a member key and the key tree it joined. A new object is a new session.
function memberState() {
  return {
    trustchain: {
      rootId: "root-id",
      walletSyncEncryptionKey: "key",
      applicationPath: "m/0'/16'/0'",
    },
    memberCredentials: { pubkey: `02${"a".repeat(64)}`, privatekey: "b".repeat(64) },
  };
}

function fakeStream(): KeyRingStream {
  return {
    ref: { treeId: "root-id", streamPath: "m/0'/16'/0'" },
    withAuth: async job => job({ accessToken: "token" }),
    encrypt: async data => data,
    decrypt: async data => data,
  };
}

function setup(pull: () => Promise<void>) {
  const dispatched: unknown[] = [];
  const extra = keyRingRuntimeExtra({
    getState: () => ({ trustchain: { trustchain: null, memberCredentials: null } }),
  });
  function dispatch(action: unknown): unknown {
    if (typeof action === "function") return action(dispatch, getState, extra);
    dispatched.push(action);
    return action;
  }
  const openStream = jest.fn((_session: KeyRingSession) => fakeStream());
  const keyRing = fakeKeyRingClient({ openStream });
  const cloudSync: KeyRingCloudSync<Doc> = {
    pull: jest.fn(pull),
    push: jest.fn(async () => undefined),
    destroy: jest.fn(async () => undefined),
    listenNotifications: jest.fn(),
  };
  const onRefreshNeeded = jest.fn(async () => undefined);
  const firstSession = selectKeyRingSession({ trustchain: memberState() });

  const hook = renderHook(
    ({
      session,
      walletSyncFeature,
    }: {
      session: KeyRingSession;
      walletSyncFeature: WalletSyncFeature;
    }) =>
      useWalletSyncWatcher({
        walletSyncFeature,
        keyRing,
        session,
        cloudSync,
        walletsync,
        getState,
        dispatch,
        localStateSelector,
        latestDistantStateSelector,
        latestWalletStateSelector,
        saveUpdate,
        onRefreshNeeded,
      }),
    { initialProps: { session: firstSession, walletSyncFeature: ENABLED } },
  );
  return { hook, dispatched, openStream, cloudSync, onRefreshNeeded, firstSession };
}

describe("useWalletSyncWatcher", () => {
  it("resets the key ring and the saved document when the key ring reports not-allowed", async () => {
    const { hook, dispatched } = setup(async () => {
      throw new KeyRingNotAllowedError();
    });

    await waitFor(() => expect(dispatched).toHaveLength(2));
    expect(dispatched[0]).toMatchObject({ type: "trustchain/keyRingReset" });
    expect(dispatched[1]).toEqual({
      type: "walletSync/walletSyncUpdate",
      payload: { data: null, version: 0 },
    });
    expect(hook.result.current.walletSyncError).toBeInstanceOf(KeyRingNotAllowedError);
    hook.unmount();
  });

  it("asks for a refresh, not a reset, when the key ring reports member-removed", async () => {
    const { hook, dispatched, onRefreshNeeded, firstSession } = setup(async () => {
      throw new KeyRingMemberRemovedError();
    });

    await waitFor(() => expect(onRefreshNeeded).toHaveBeenCalledWith(firstSession));
    expect(dispatched).toEqual([]);
    expect(hook.result.current.walletSyncError).toBeNull();
    hook.unmount();
  });

  it("stops the loop when the flag is turned off", async () => {
    const { hook, cloudSync, firstSession } = setup(async () => undefined);
    await waitFor(() => expect(cloudSync.pull).toHaveBeenCalledTimes(1));

    hook.rerender({ session: firstSession, walletSyncFeature: { enabled: false } });
    hook.result.current.onUserRefresh();

    await waitFor(() => expect(hook.result.current.visualPending).toBe(false));
    await new Promise(resolve => setTimeout(resolve, 20));
    expect(cloudSync.pull).toHaveBeenCalledTimes(1);
    hook.unmount();
  });

  it("restarts the loop on the stream of a new session", async () => {
    const { hook, cloudSync, openStream } = setup(async () => undefined);
    await waitFor(() => expect(cloudSync.pull).toHaveBeenCalledTimes(1));

    const nextSession = selectKeyRingSession({ trustchain: memberState() });
    hook.rerender({ session: nextSession, walletSyncFeature: ENABLED });

    await waitFor(() => expect(cloudSync.pull).toHaveBeenCalledTimes(2));
    expect(openStream).toHaveBeenLastCalledWith(nextSession);
    hook.unmount();
  });
});
