import { act, renderHook, waitFor, withFlagOverrides } from "tests/testSetup";
import useDeeplink from "..";

type DeepLinkListener = (event: unknown, url: string) => void;

const mockDeepLinkListeners: Record<string, DeepLinkListener> = {};
const mockHandler = jest.fn();

jest.mock("electron", () => ({
  ipcRenderer: {
    on: jest.fn((channel: string, listener: DeepLinkListener) => {
      mockDeepLinkListeners[channel] = listener;
    }),
    removeListener: jest.fn(),
  },
}));

jest.mock("../useDeepLinkHandler", () => ({
  useDeepLinkHandler: () => ({
    handler: mockHandler,
  }),
}));

describe("useDeeplink", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    for (const key of Object.keys(mockDeepLinkListeners)) {
      delete mockDeepLinkListeners[key];
    }
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
      mockDeepLinkListeners["deep-linking"](undefined, url);
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
      mockDeepLinkListeners["deep-linking"](undefined, url);
    });

    expect(mockHandler).toHaveBeenCalledWith(url, false);
    expect(store.getState().settings.deepLinkUrl).toBeNull();
  });
});
