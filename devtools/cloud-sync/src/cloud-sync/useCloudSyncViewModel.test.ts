import { renderHook, act } from "@testing-library/react";
import { useCloudSyncViewModel } from "./useCloudSyncViewModel";
import type { CloudSyncDevToolProps } from "../types";

const mockPull = jest.fn(() => Promise.resolve());
const mockPush = jest.fn(() => Promise.resolve());
const mockDestroy = jest.fn(() => Promise.resolve());
const mockUnsubscribe = jest.fn();
const mockListenSubscribe = jest.fn((_callbacks?: unknown) => ({ unsubscribe: mockUnsubscribe }));

jest.mock("@shared/cloud-sync", () => ({
  CloudSyncSDK: class {
    pull(...args: unknown[]) {
      return (mockPull as (...a: unknown[]) => unknown)(...args);
    }
    push(...args: unknown[]) {
      return (mockPush as (...a: unknown[]) => unknown)(...args);
    }
    destroy(...args: unknown[]) {
      return (mockDestroy as (...a: unknown[]) => unknown)(...args);
    }
    listenNotifications() {
      return { subscribe: (callbacks: unknown) => mockListenSubscribe(callbacks) };
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

describe("useCloudSyncViewModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPull.mockResolvedValue(undefined);
    mockPush.mockResolvedValue(undefined);
    mockDestroy.mockResolvedValue(undefined);
    mockUnsubscribe.mockReset();
    mockListenSubscribe.mockReturnValue({ unsubscribe: mockUnsubscribe });
  });

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

  it("canPush is false when json is empty", () => {
    const { result } = renderHook(() =>
      useCloudSyncViewModel(
        buildProps({
          liveState: { trustchain: TRUSTCHAIN, memberCredentials: MEMBER_CREDENTIALS },
        }),
      ),
    );
    expect(result.current.canPush).toBe(false);
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

  it("setJson updates the json state", () => {
    const { result } = renderHook(() => useCloudSyncViewModel(buildProps()));
    act(() => result.current.setJson("hello"));
    expect(result.current.json).toBe("hello");
  });

  it("uses walletSyncVersion from props when provided", () => {
    const { result } = renderHook(() =>
      useCloudSyncViewModel(buildProps({ walletSyncVersion: 42 })),
    );
    expect(result.current.version).toBe(42);
  });

  it("pull is a no-op when liveState is null", async () => {
    const props = buildProps();
    const { result } = renderHook(() => useCloudSyncViewModel(props));
    await act(async () => {
      await result.current.pull();
    });
    expect(mockPull).not.toHaveBeenCalled();
  });

  it("pull calls sdk.pull when liveState is set", async () => {
    const props = buildProps({
      liveState: { trustchain: TRUSTCHAIN, memberCredentials: MEMBER_CREDENTIALS },
    });
    const { result } = renderHook(() => useCloudSyncViewModel(props));
    await act(async () => {
      await result.current.pull();
    });
    expect(mockPull).toHaveBeenCalledWith(TRUSTCHAIN, MEMBER_CREDENTIALS);
  });

  it("push is a no-op when liveState is null", async () => {
    const props = buildProps();
    const { result } = renderHook(() => useCloudSyncViewModel(props));
    act(() => result.current.setJson('{"k":"v"}'));
    await act(async () => {
      await result.current.push();
    });
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("push is a no-op when json is empty even with liveState", async () => {
    const props = buildProps({
      liveState: { trustchain: TRUSTCHAIN, memberCredentials: MEMBER_CREDENTIALS },
    });
    const { result } = renderHook(() => useCloudSyncViewModel(props));
    await act(async () => {
      await result.current.push();
    });
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("push calls sdk.push when liveState is set and json is non-empty", async () => {
    const props = buildProps({
      liveState: { trustchain: TRUSTCHAIN, memberCredentials: MEMBER_CREDENTIALS },
    });
    const { result } = renderHook(() => useCloudSyncViewModel(props));
    act(() => result.current.setJson('{"k":"v"}'));
    await act(async () => {
      await result.current.push();
    });
    expect(mockPush).toHaveBeenCalledWith(TRUSTCHAIN, MEMBER_CREDENTIALS, { k: "v" });
  });

  it("destroy is a no-op when liveState is null", async () => {
    const props = buildProps();
    const { result } = renderHook(() => useCloudSyncViewModel(props));
    await act(async () => {
      await result.current.destroy();
    });
    expect(mockDestroy).not.toHaveBeenCalled();
  });

  it("destroy calls sdk.destroy when liveState is set", async () => {
    const props = buildProps({
      liveState: { trustchain: TRUSTCHAIN, memberCredentials: MEMBER_CREDENTIALS },
    });
    const { result } = renderHook(() => useCloudSyncViewModel(props));
    await act(async () => {
      await result.current.destroy();
    });
    expect(mockDestroy).toHaveBeenCalledWith(TRUSTCHAIN, MEMBER_CREDENTIALS);
  });

  it("listen is a no-op when liveState is null", async () => {
    const props = buildProps();
    const { result } = renderHook(() => useCloudSyncViewModel(props));
    await act(async () => {
      await result.current.listen();
    });
    expect(result.current.listening).toBe(false);
    expect(mockListenSubscribe).not.toHaveBeenCalled();
  });

  it("listen sets listening=true when liveState is set", async () => {
    const props = buildProps({
      liveState: { trustchain: TRUSTCHAIN, memberCredentials: MEMBER_CREDENTIALS },
    });
    const { result } = renderHook(() => useCloudSyncViewModel(props));
    await act(async () => {
      await result.current.listen();
    });
    expect(result.current.listening).toBe(true);
    expect(mockListenSubscribe).toHaveBeenCalledTimes(1);
  });

  it("listen is idempotent — second call is a no-op when already listening", async () => {
    const props = buildProps({
      liveState: { trustchain: TRUSTCHAIN, memberCredentials: MEMBER_CREDENTIALS },
    });
    const { result } = renderHook(() => useCloudSyncViewModel(props));
    await act(async () => {
      await result.current.listen();
    });
    await act(async () => {
      await result.current.listen();
    });
    expect(mockListenSubscribe).toHaveBeenCalledTimes(1);
  });

  it("stopListen sets listening=false and calls unsubscribe", async () => {
    const props = buildProps({
      liveState: { trustchain: TRUSTCHAIN, memberCredentials: MEMBER_CREDENTIALS },
    });
    const { result } = renderHook(() => useCloudSyncViewModel(props));
    await act(async () => {
      await result.current.listen();
    });
    act(() => {
      result.current.stopListen();
    });
    expect(result.current.listening).toBe(false);
    expect(mockUnsubscribe).toHaveBeenCalledTimes(1);
  });

  it("listen sets listenError and stops listening when subscribe error callback fires", async () => {
    let capturedCallbacks: { error?: (e: unknown) => void } = {};
    mockListenSubscribe.mockImplementation(callbacks => {
      capturedCallbacks = callbacks as typeof capturedCallbacks;
      return { unsubscribe: mockUnsubscribe };
    });
    const props = buildProps({
      liveState: { trustchain: TRUSTCHAIN, memberCredentials: MEMBER_CREDENTIALS },
    });
    const { result } = renderHook(() => useCloudSyncViewModel(props));

    await act(async () => {
      await result.current.listen();
    });

    act(() => {
      capturedCallbacks.error?.(new Error("connection failed"));
    });

    expect(result.current.listening).toBe(false);
    expect(result.current.listenError).toBe("Error: connection failed");
  });

  it("listen stops listening when subscribe complete callback fires", async () => {
    let capturedCallbacks: { complete?: () => void } = {};
    mockListenSubscribe.mockImplementation(callbacks => {
      capturedCallbacks = callbacks as typeof capturedCallbacks;
      return { unsubscribe: mockUnsubscribe };
    });
    const props = buildProps({
      liveState: { trustchain: TRUSTCHAIN, memberCredentials: MEMBER_CREDENTIALS },
    });
    const { result } = renderHook(() => useCloudSyncViewModel(props));

    await act(async () => {
      await result.current.listen();
    });

    act(() => {
      capturedCallbacks.complete?.();
    });

    expect(result.current.listening).toBe(false);
  });

  it("SDK cleanup effect unsubscribes and resets listening when cloudSyncApiBaseUrl changes", async () => {
    const stableCreateSdk = buildProps().createSdk;
    const { result, rerender } = renderHook(
      (props: CloudSyncDevToolProps) => useCloudSyncViewModel(props),
      {
        initialProps: {
          createSdk: stableCreateSdk,
          liveState: { trustchain: TRUSTCHAIN, memberCredentials: MEMBER_CREDENTIALS },
          cloudSyncApiBaseUrl: "http://cloud-sync-1.test",
          trustchainApiBaseUrl: "http://trustchain.test",
        },
      },
    );

    await act(async () => {
      await result.current.listen();
    });
    expect(result.current.listening).toBe(true);

    act(() => {
      rerender({
        createSdk: stableCreateSdk,
        liveState: { trustchain: TRUSTCHAIN, memberCredentials: MEMBER_CREDENTIALS },
        cloudSyncApiBaseUrl: "http://cloud-sync-2.test",
        trustchainApiBaseUrl: "http://trustchain.test",
      });
    });

    expect(result.current.listening).toBe(false);
    expect(mockUnsubscribe).toHaveBeenCalledTimes(1);
  });
});
