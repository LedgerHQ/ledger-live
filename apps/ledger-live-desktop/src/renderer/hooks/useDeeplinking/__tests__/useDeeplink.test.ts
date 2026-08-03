import { act, renderHook, waitFor, withFlagOverrides } from "tests/testSetup";
import { deeplink } from "~/renderer/bridge";
import useDeeplink from "..";

const mockHandler = jest.fn();

// The bridge delivers just the url — the preload strips the IpcRendererEvent — and hands
// back an unsubscribe closure rather than accepting the listener for removal.
let emitDeepLink: ((url: string) => void) | undefined;

jest.mock("../useDeepLinkHandler", () => ({
  useDeepLinkHandler: () => ({
    handler: mockHandler,
  }),
}));

describe("useDeeplink", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    emitDeepLink = undefined;
    // Re-established after clearAllMocks, which drops implementations.
    jest.mocked(deeplink.onOpen).mockImplementation(callback => {
      emitDeepLink = callback;
      return () => {
        emitDeepLink = undefined;
      };
    });
  });

  it("should queue background deeplinks while locked and replay them as background when hardening is enabled", async () => {
    const url = "ledgerlive://swap";
    const { store } = renderHook(() => useDeeplink(), {
      initialState: {
        ...withFlagOverrides({ lwdDeeplinkOpenHardening: { enabled: true } }),
        application: { isLocked: true },
        settings: {
          loaded: true,
          deepLinkUrl: null,
        },
      },
    });

    act(() => {
      emitDeepLink!(url);
    });

    expect(mockHandler).not.toHaveBeenCalled();
    expect(store.getState().settings.deepLinkUrl).toBeNull();

    act(() => {
      store.dispatch({ type: "APPLICATION_SET_DATA", payload: { isLocked: false } });
    });

    await waitFor(() => {
      expect(mockHandler).toHaveBeenCalledWith(url, false);
    });
    expect(store.getState().settings.deepLinkUrl).toBeNull();
  });

  it("should replay startup deeplinks as app start once unlocked when hardening is enabled", async () => {
    const url = "ledgerlive://swap";
    const { store } = renderHook(() => useDeeplink(), {
      initialState: {
        ...withFlagOverrides({ lwdDeeplinkOpenHardening: { enabled: true } }),
        application: { isLocked: true },
        settings: {
          loaded: true,
          deepLinkUrl: url,
        },
      },
    });

    expect(mockHandler).not.toHaveBeenCalled();

    act(() => {
      store.dispatch({ type: "APPLICATION_SET_DATA", payload: { isLocked: false } });
    });

    await waitFor(() => {
      expect(mockHandler).toHaveBeenCalledWith(url, true);
      expect(store.getState().settings.deepLinkUrl).toBeNull();
    });
  });

  it("should process background deeplinks while locked when hardening is disabled", () => {
    const url = "ledgerlive://swap";
    const { store } = renderHook(() => useDeeplink(), {
      initialState: {
        ...withFlagOverrides({ lwdDeeplinkOpenHardening: { enabled: false } }),
        application: { isLocked: true },
        settings: {
          loaded: true,
          deepLinkUrl: null,
        },
      },
    });

    act(() => {
      emitDeepLink!(url);
    });

    expect(mockHandler).toHaveBeenCalledWith(url, false);
    expect(store.getState().settings.deepLinkUrl).toBeNull();
  });
});
