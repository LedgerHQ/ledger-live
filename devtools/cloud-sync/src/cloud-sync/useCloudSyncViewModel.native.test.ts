import { renderHook, act } from "@support/jest-devtools/native";
import { useCloudSyncViewModel } from "./useCloudSyncViewModel";
import type { CloudSyncDevToolProps } from "../types";

jest.mock("@shared/cloud-sync", () => ({
  CloudSyncSDK: class {
    pull() {
      return Promise.resolve();
    }
    push() {
      return Promise.resolve();
    }
    destroy() {
      return Promise.resolve();
    }
    listenNotifications() {
      return { subscribe: () => ({ unsubscribe: jest.fn() }) };
    }
  },
}));

const TRUSTCHAIN = { rootId: "root", walletSyncEncryptionKey: "key", applicationPath: "path" };
const MEMBER_CREDENTIALS = { pubkey: "pub", privatekey: "priv" };

function buildProps(overrides: Partial<CloudSyncDevToolProps> = {}): CloudSyncDevToolProps {
  return {
    createSdk: () => ({}) as never,
    liveState: null,
    cloudSyncApiBaseUrl: "http://cloud-sync.test",
    trustchainApiBaseUrl: "http://trustchain.test",
    ...overrides,
  };
}

describe("useCloudSyncViewModel (native)", () => {
  it("isReady is false when liveState is null", () => {
    const { result } = renderHook(() => useCloudSyncViewModel(buildProps()));
    expect(result.current.isReady).toBe(false);
  });

  it("isReady is true when liveState has trustchain and memberCredentials", () => {
    const { result } = renderHook(() =>
      useCloudSyncViewModel(
        buildProps({
          liveState: { trustchain: TRUSTCHAIN, memberCredentials: MEMBER_CREDENTIALS },
        }),
      ),
    );
    expect(result.current.isReady).toBe(true);
  });

  it("canPush is true when isReady and json is set", () => {
    const { result } = renderHook(() =>
      useCloudSyncViewModel(
        buildProps({
          liveState: { trustchain: TRUSTCHAIN, memberCredentials: MEMBER_CREDENTIALS },
        }),
      ),
    );
    act(() => result.current.setJson('{"k":"v"}'));
    expect(result.current.canPush).toBe(true);
  });

  it("uses walletSyncVersion from props when provided", () => {
    const { result } = renderHook(() =>
      useCloudSyncViewModel(buildProps({ walletSyncVersion: 42 })),
    );
    expect(result.current.version).toBe(42);
  });
});
