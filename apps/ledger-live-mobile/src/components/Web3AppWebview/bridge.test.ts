import { act, renderHook } from "@testing-library/react-native";
import type { WebView, WebViewMessageEvent } from "react-native-webview";
import type { BridgeSession } from "@ledgerhq/live-common/wallet-api/bridgeSession";
import {
  acceptWebviewMessage,
  buildOriginBoundMessageScript,
  useWebviewBridgeSession,
} from "./bridge";

const runScript = (script: string, origin: string) => {
  const target = { dispatchEvent: jest.fn() };
  class FakeMessageEvent {
    constructor(
      readonly type: string,
      readonly init: { data: string },
    ) {}
  }
  const result = new Function("window", "document", "MessageEvent", `return ${script}`)(
    { location: { origin }, dispatchEvent: target.dispatchEvent },
    target,
    FakeMessageEvent,
  );
  return { result, dispatched: target.dispatchEvent.mock.calls.map(([event]) => event) };
};

const messageEvent = (url: string, isMainFrame: boolean | undefined) =>
  ({ nativeEvent: { url, isMainFrame, data: "{}" } }) as unknown as WebViewMessageEvent;

describe("buildOriginBoundMessageScript", () => {
  it("dispatches the message when the main frame is on the target origin", () => {
    const script = buildOriginBoundMessageScript('{"id":1}', "https://app.example.com", "window");
    const { dispatched } = runScript(script, "https://app.example.com");

    expect(dispatched).toHaveLength(1);
    expect(dispatched[0]).toMatchObject({ type: "message", init: { data: '{"id":1}' } });
  });

  it("drops the message when the main frame is on another origin", () => {
    const script = buildOriginBoundMessageScript("{}", "https://app.example.com", "document");

    expect(runScript(script, "https://evil.com").dispatched).toHaveLength(0);
  });

  it("keeps any message content as data, never as code", () => {
    const message = '"); window.pwned = true; ("\u2028</script>';
    const script = buildOriginBoundMessageScript(message, "https://app.example.com", "window");
    const { dispatched } = runScript(script, "https://app.example.com");

    expect(dispatched[0].init.data).toBe(message);
  });
});

describe("acceptWebviewMessage", () => {
  const domains = ["https://app.example.com"];

  beforeEach(() => {
    jest.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.mocked(console.warn).mockRestore();
  });

  it("hands a main-frame message on a manifest origin to the session of that origin", () => {
    const session = {} as BridgeSession;
    const accept = jest.fn((_origin: string): BridgeSession | undefined => session);

    expect(
      acceptWebviewMessage(messageEvent("https://app.example.com/page", true), domains, accept),
    ).toBe(session);
    expect(accept).toHaveBeenCalledWith("https://app.example.com");
  });

  it.each([
    ["a subframe", messageEvent("https://app.example.com/", false)],
    ["an unknown frame", messageEvent("https://app.example.com/", undefined)],
    ["another origin", messageEvent("https://evil.com/", true)],
    ["an opaque origin", messageEvent("about:blank", true)],
  ])("drops a message from %s", (_name, event) => {
    const accept = jest.fn((_origin: string): BridgeSession | undefined => undefined);

    expect(acceptWebviewMessage(event, domains, accept)).toBeUndefined();
    expect(accept).not.toHaveBeenCalled();
  });

  it("tells who sent a dropped message, e.g. the Android fallback bridge that never says", () => {
    const accept = jest.fn((_origin: string): BridgeSession | undefined => undefined);
    const onDropped = jest.fn();

    acceptWebviewMessage(
      messageEvent("https://app.example.com/", undefined),
      domains,
      accept,
      onDropped,
    );

    expect(onDropped).toHaveBeenCalledWith({
      url: "https://app.example.com/",
      isMainFrame: undefined,
    });
  });

  it("does not report a message it hands over", () => {
    const accept = jest.fn((_origin: string): BridgeSession | undefined => ({}) as BridgeSession);
    const onDropped = jest.fn();

    acceptWebviewMessage(
      messageEvent("https://app.example.com/", true),
      domains,
      accept,
      onDropped,
    );

    expect(onDropped).not.toHaveBeenCalled();
  });

  it("answers any web origin when the domain check is off, never a known subframe", () => {
    const accept = jest.fn((_origin: string): BridgeSession | undefined => ({}) as BridgeSession);

    acceptWebviewMessage(messageEvent("https://evil.com/", undefined), undefined, accept);
    acceptWebviewMessage(messageEvent("https://iframe.com/", false), undefined, accept);

    expect(accept).toHaveBeenCalledTimes(1);
    expect(accept).toHaveBeenCalledWith("https://evil.com");
  });
});

describe("useWebviewBridgeSession", () => {
  const makeWebviewRef = () => {
    const injectJavaScript = jest.fn();
    return {
      ref: { current: { injectJavaScript } as unknown as WebView },
      injectJavaScript,
    };
  };

  it("replies through an origin-bound script", () => {
    const { ref, injectJavaScript } = makeWebviewRef();
    const { result } = renderHook(() =>
      useWebviewBridgeSession(ref, "https://app.example.com/", jest.fn()),
    );

    result.current.session.send('{"id":1}');

    const [script] = injectJavaScript.mock.calls[0];
    expect(script).toContain('"https://app.example.com"');
    expect(runScript(script, "https://evil.com").dispatched).toHaveLength(0);
  });

  it("closes the Live App drawers when the main frame changes origin", () => {
    const { ref, injectJavaScript } = makeWebviewRef();
    const onReset = jest.fn();
    const { result, rerender } = renderHook(
      ({ url }: { url: string }) => useWebviewBridgeSession(ref, url, onReset),
      { initialProps: { url: "https://app.example.com/" } },
    );
    const firstSession = result.current.session;

    rerender({ url: "https://app.example.com/next" });
    expect(onReset).not.toHaveBeenCalled();

    act(() => rerender({ url: "https://other.example.com/" }));

    expect(onReset).toHaveBeenCalledTimes(1);
    firstSession.send("late reply");
    expect(injectJavaScript).not.toHaveBeenCalled();
  });
});
