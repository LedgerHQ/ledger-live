import { act, renderHook } from "@testing-library/react";
import { bindUiFlowToSession } from "@ledgerhq/live-common/wallet-api/bridgeSession";
import type { WebviewBridgeMessage } from "~/bridge/contract";
import { webview } from "~/renderer/bridge";
import { closeAllModal } from "~/renderer/actions/modals";
import { closePlatformAppDrawer } from "~/renderer/actions/UI";
import { setDrawer } from "~/renderer/drawers/Provider";
import { closeDialog } from "~/renderer/reducers/modularDialog";
import { useWebviewBridgeMessages, useWebviewBridgeSession } from "./bridge";
import type { WebviewTag } from "./types";

const mockDispatch = jest.fn();

jest.mock("LLD/hooks/redux", () => ({
  useDispatch: () => mockDispatch,
}));

jest.mock("~/renderer/drawers/Provider", () => ({
  setDrawer: jest.fn(),
}));

const makeWebviewRef = (guestId = 7) => {
  const postMessage = jest.fn();
  const guest = {
    getWebContentsId: jest.fn(() => guestId),
    contentWindow: { postMessage },
  };
  return { ref: { current: guest as unknown as WebviewTag }, postMessage };
};

describe("useWebviewBridgeSession", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("posts replies to the origin of the session only", () => {
    const { ref, postMessage } = makeWebviewRef();
    const { result } = renderHook(() => useWebviewBridgeSession(ref, "https://app.example.com/"));

    result.current.session.send("reply");

    expect(postMessage).toHaveBeenCalledWith("reply", "https://app.example.com");
  });

  it("closes the flows the Live App opened when the main frame changes origin", () => {
    const { ref, postMessage } = makeWebviewRef();
    const { result, rerender } = renderHook(({ url }) => useWebviewBridgeSession(ref, url), {
      initialProps: { url: "https://app.example.com/" },
    });
    const firstSession = result.current.session;
    bindUiFlowToSession(firstSession, jest.fn())({});

    rerender({ url: "https://app.example.com/other-page" });
    expect(mockDispatch).not.toHaveBeenCalled();

    act(() => rerender({ url: "https://other.example.com/" }));

    expect(mockDispatch).toHaveBeenCalledWith(closeAllModal());
    expect(mockDispatch).toHaveBeenCalledWith(closePlatformAppDrawer());
    expect(mockDispatch).toHaveBeenCalledWith(closeDialog());
    expect(setDrawer).toHaveBeenCalledWith();
    expect(result.current.session).not.toBe(firstSession);

    firstSession.send("late reply");
    expect(postMessage).not.toHaveBeenCalled();
  });
});

describe("useWebviewBridgeSession reset scope", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const changeOrigin = (options?: { closeUnopenedFlows?: boolean }, openFlow = false) => {
    const { ref } = makeWebviewRef();
    const { result, rerender } = renderHook(
      ({ url }) => useWebviewBridgeSession(ref, url, options),
      { initialProps: { url: "https://app.example.com/" } },
    );
    if (openFlow) bindUiFlowToSession(result.current.session, jest.fn())({});
    act(() => rerender({ url: "https://other.example.com/" }));
  };

  it("leaves the modals, drawers and dialogs alone when the Live App opened no flow", () => {
    changeOrigin();

    expect(mockDispatch).not.toHaveBeenCalled();
    expect(setDrawer).not.toHaveBeenCalled();
  });

  it("closes them when the session opened a flow", () => {
    changeOrigin(undefined, true);

    expect(mockDispatch).toHaveBeenCalledWith(closeAllModal());
    expect(setDrawer).toHaveBeenCalledWith();
  });

  it("closes them even if the session opened no flow, for the Platform API", () => {
    changeOrigin({ closeUnopenedFlows: true });

    expect(mockDispatch).toHaveBeenCalledWith(closeAllModal());
    expect(setDrawer).toHaveBeenCalledWith();
  });
});

describe("useWebviewBridgeMessages", () => {
  const message: WebviewBridgeMessage = {
    guestId: 7,
    origin: "https://app.example.com",
    channel: "webviewToParent",
    message: "{}",
  };

  it("only hands over the messages of its own guest", () => {
    const { ref } = makeWebviewRef(7);
    const onBridgeMessage = jest.fn();
    renderHook(() => useWebviewBridgeMessages(ref, onBridgeMessage));
    const [listener] = jest.mocked(webview.onMessage).mock.calls[0];

    listener(message);
    listener({ ...message, guestId: 8 });

    expect(onBridgeMessage).toHaveBeenCalledTimes(1);
    expect(onBridgeMessage).toHaveBeenCalledWith(message);
  });

  it("unsubscribes on unmount", () => {
    const unsubscribe = jest.fn();
    jest.mocked(webview.onMessage).mockReturnValueOnce(unsubscribe);
    const { ref } = makeWebviewRef();
    const { unmount } = renderHook(() => useWebviewBridgeMessages(ref, jest.fn()));

    unmount();

    expect(unsubscribe).toHaveBeenCalled();
  });
});
