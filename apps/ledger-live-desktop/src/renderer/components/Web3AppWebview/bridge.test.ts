import { renderHook } from "@testing-library/react";
import type { WebviewBridgeMessage } from "~/bridge/contract";
import { webview } from "~/renderer/bridge";
import { useWebviewBridgeMessages } from "./bridge";
import type { WebviewTag } from "./types";

const makeWebviewRef = (guestId = 7) => {
  const guest = { getWebContentsId: jest.fn(() => guestId) };
  return { ref: { current: guest as unknown as WebviewTag } };
};

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
