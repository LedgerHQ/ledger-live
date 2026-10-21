/**
 * @jest-environment jsdom
 */
import { StrictMode } from "react";
import { act, renderHook } from "@testing-library/react";
import { BridgeSessionClosed } from "../errors";
import {
  BridgeSession,
  bindUiFlowToSession,
  getBridgeOrigin,
  isBridgeSenderAllowed,
  useBridgeSession,
} from "./bridgeSession";

describe("getBridgeOrigin", () => {
  it.each([
    ["https://app.example.com/path?q=1", "https://app.example.com"],
    ["http://localhost:3000/", "http://localhost:3000"],
    ["https://app.example.com", "https://app.example.com"],
  ])("returns the origin of %s", (url, origin) => {
    expect(getBridgeOrigin(url)).toBe(origin);
  });

  it.each([undefined, "", "about:blank", "data:text/html,hi", "null", "not a url", "file:///etc"])(
    "returns undefined for %s",
    url => {
      expect(getBridgeOrigin(url)).toBeUndefined();
    },
  );
});

describe("isBridgeSenderAllowed", () => {
  const domains = ["https://app.example.com", "https://*.partner.com"];

  it("answers the main frame on a manifest origin", () => {
    expect(
      isBridgeSenderAllowed({ url: "https://app.example.com/a", isMainFrame: true }, domains),
    ).toBe(true);
    expect(
      isBridgeSenderAllowed({ url: "https://x.partner.com", isMainFrame: true }, domains),
    ).toBe(true);
  });

  it("does not answer a subframe, even on a manifest origin", () => {
    expect(
      isBridgeSenderAllowed({ url: "https://app.example.com", isMainFrame: false }, domains),
    ).toBe(false);
  });

  it("does not answer a sender whose frame is unknown", () => {
    expect(
      isBridgeSenderAllowed({ url: "https://app.example.com", isMainFrame: undefined }, domains),
    ).toBe(false);
  });

  it("does not answer an origin outside the manifest domains", () => {
    expect(isBridgeSenderAllowed({ url: "https://evil.com", isMainFrame: true }, domains)).toBe(
      false,
    );
    expect(
      isBridgeSenderAllowed({ url: "http://app.example.com", isMainFrame: true }, domains),
    ).toBe(false);
    expect(isBridgeSenderAllowed({ url: "about:blank", isMainFrame: true }, domains)).toBe(false);
    expect(isBridgeSenderAllowed({ url: "https://app.example.com", isMainFrame: true }, [])).toBe(
      false,
    );
  });

  it("answers any web origin when the domain check is off, never a known subframe", () => {
    expect(isBridgeSenderAllowed({ url: "https://evil.com", isMainFrame: true }, undefined)).toBe(
      true,
    );
    expect(
      isBridgeSenderAllowed({ url: "https://evil.com", isMainFrame: undefined }, undefined),
    ).toBe(true);
    expect(isBridgeSenderAllowed({ url: "https://evil.com", isMainFrame: false }, undefined)).toBe(
      false,
    );
    expect(isBridgeSenderAllowed({ url: "about:blank", isMainFrame: true }, undefined)).toBe(false);
  });
});

describe("BridgeSession", () => {
  it("posts to its origin only, and nothing before it has one", () => {
    const postMessage = jest.fn();
    const session = new BridgeSession(undefined, postMessage);

    session.send("too early");
    expect(postMessage).not.toHaveBeenCalled();

    expect(session.bind("https://app.example.com")).toBe(true);
    session.send("reply");
    expect(postMessage).toHaveBeenCalledWith("reply", "https://app.example.com");
  });

  it("stays bound to its first origin", () => {
    const session = new BridgeSession(undefined, jest.fn());

    session.bind("https://app.example.com");

    expect(session.bind("https://other.example.com")).toBe(false);
    expect(session.origin).toBe("https://app.example.com");
  });

  it("queues messages until its server is active", () => {
    const session = new BridgeSession("https://app.example.com", jest.fn());
    const onMessage = jest.fn();
    session.onMessage = onMessage;

    session.receive("first");
    expect(onMessage).not.toHaveBeenCalled();

    session.activate();
    session.receive("second");
    expect(onMessage.mock.calls).toEqual([["first"], ["second"]]);
  });

  it("rejects its pending requests and drops its replies once closed", async () => {
    const postMessage = jest.fn();
    const session = new BridgeSession("https://app.example.com", postMessage);
    const onMessage = jest.fn();
    session.onMessage = onMessage;
    const pending = session.cancelOnClose(new Promise(() => {}));

    session.close();

    await expect(pending).rejects.toBeInstanceOf(BridgeSessionClosed);
    session.send("late reply");
    session.activate();
    session.receive("late request");
    expect(postMessage).not.toHaveBeenCalled();
    expect(onMessage).not.toHaveBeenCalled();
    expect(session.bind("https://app.example.com")).toBe(false);
  });

  it("drops the messages queued before it was closed", () => {
    const session = new BridgeSession("https://app.example.com", jest.fn());
    const handle = jest.fn();

    session.deliver(handle);
    session.close();
    session.activate();

    expect(handle).not.toHaveBeenCalled();
  });

  it("does not run the queued messages left after one of them closed it", () => {
    const session = new BridgeSession("https://app.example.com", jest.fn());
    const next = jest.fn();

    session.deliver(() => session.close());
    session.deliver(next);
    session.activate();

    expect(next).not.toHaveBeenCalled();
  });

  it("settles like the request while open", async () => {
    const session = new BridgeSession("https://app.example.com", jest.fn());

    await expect(session.cancelOnClose(Promise.resolve(42))).resolves.toBe(42);
    await expect(session.cancelOnClose("value")).resolves.toBe("value");
  });

  it("does not retain the requests that already settled", async () => {
    const session = new BridgeSession("https://app.example.com", jest.fn());
    const closeListeners = (session as unknown as { closeListeners: Set<unknown> }).closeListeners;

    await session.cancelOnClose(Promise.resolve(1));
    await expect(session.cancelOnClose(Promise.reject(new Error("failed")))).rejects.toThrow();

    expect(closeListeners.size).toBe(0);
  });

  it("rejects a request made once closed", async () => {
    const session = new BridgeSession("https://app.example.com", jest.fn());
    session.close();

    await expect(session.cancelOnClose(Promise.resolve(1))).rejects.toBeInstanceOf(
      BridgeSessionClosed,
    );
  });

  it("observes a request that fails after it was closed", async () => {
    const session = new BridgeSession("https://app.example.com", jest.fn());
    session.close();
    const failing = Promise.reject(new Error("failed"));
    const catchSpy = jest.spyOn(failing, "catch");

    await expect(session.cancelOnClose(failing)).rejects.toBeInstanceOf(BridgeSessionClosed);
    expect(catchSpy).toHaveBeenCalled();
  });

  it("does not run a request continuation once closed", () => {
    const session = new BridgeSession("https://app.example.com", jest.fn());
    const openUi = jest.fn(() => "opened");
    const continuation = session.whileOpen(openUi);

    expect(continuation()).toBe("opened");
    session.close();

    expect(() => continuation()).toThrow(BridgeSessionClosed);
    expect(openUi).toHaveBeenCalledTimes(1);
  });
});

describe("bindUiFlowToSession", () => {
  it("opens the flow and forwards its callbacks while the session is open", () => {
    const session = new BridgeSession("https://app.example.com", jest.fn());
    const onSuccess = jest.fn();
    const open = jest.fn((params: { appName: string; onSuccess: (id: string) => void }) =>
      params.onSuccess(params.appName),
    );

    bindUiFlowToSession(session, open)({ appName: "Ethereum", onSuccess });

    expect(onSuccess).toHaveBeenCalledWith("Ethereum");
  });

  it("does not open the flow once the session is closed", () => {
    const session = new BridgeSession("https://app.example.com", jest.fn());
    const open = jest.fn();
    session.close();

    bindUiFlowToSession(session, open)({ onSuccess: jest.fn() });

    expect(open).not.toHaveBeenCalled();
  });

  it("drops the callbacks of a flow that completes after the session is closed", () => {
    const session = new BridgeSession("https://app.example.com", jest.fn());
    const onSuccess = jest.fn();
    let complete: (id: string) => void = () => {};
    bindUiFlowToSession(session, (params: { onSuccess: (id: string) => void }) => {
      complete = params.onSuccess;
    })({ onSuccess });

    session.close();
    complete("device");

    expect(onSuccess).not.toHaveBeenCalled();
  });
});

describe("useBridgeSession", () => {
  const setup = () => {
    const postMessage = jest.fn();
    const onReset = jest.fn();
    const hook = renderHook(() => useBridgeSession({ postMessage, onReset }));
    return { ...hook, postMessage, onReset };
  };

  it("binds the first session to the first main-frame origin without a reset", () => {
    const { result, onReset } = setup();
    const session = result.current.session;

    act(() => result.current.onMainFrameNavigation("https://app.example.com/"));

    expect(result.current.session).toBe(session);
    expect(session.origin).toBe("https://app.example.com");
    expect(onReset).not.toHaveBeenCalled();
  });

  it("binds the first session to the origin of the first accepted message", () => {
    const { result } = setup();

    expect(result.current.accept("https://app.example.com")).toBe(result.current.session);
    expect(result.current.session.origin).toBe("https://app.example.com");
  });

  it("keeps the session across navigations on the same origin", () => {
    const { result, onReset } = setup();
    act(() => result.current.onMainFrameNavigation("https://app.example.com/"));
    const session = result.current.session;

    act(() => result.current.onMainFrameNavigation("https://app.example.com/next"));

    expect(result.current.session).toBe(session);
    expect(onReset).not.toHaveBeenCalled();
  });

  it("resets the session when the main frame moves to another origin", async () => {
    const { result, onReset, postMessage } = setup();
    act(() => result.current.onMainFrameNavigation("https://app.example.com/"));
    const previous = result.current.session;
    const pending = previous.cancelOnClose(new Promise(() => {}));

    act(() => result.current.onMainFrameNavigation("https://other.example.com/"));

    expect(onReset).toHaveBeenCalledWith(previous);
    expect(previous.isOpen).toBe(false);
    await expect(pending).rejects.toBeInstanceOf(BridgeSessionClosed);
    expect(result.current.session).not.toBe(previous);
    expect(result.current.session.origin).toBe("https://other.example.com");

    previous.send("reply to the previous origin");
    result.current.session.send("reply to the new origin");
    expect(postMessage.mock.calls).toEqual([
      ["reply to the new origin", "https://other.example.com"],
    ]);
  });

  it("resets to an unbound session when the main frame leaves the web (about:blank)", () => {
    const { result, onReset } = setup();
    act(() => result.current.onMainFrameNavigation("https://app.example.com/"));

    act(() => result.current.onMainFrameNavigation("about:blank"));

    expect(onReset).toHaveBeenCalledTimes(1);
    expect(result.current.session.origin).toBeUndefined();
  });

  it("drops a message from another origin and resets the session", () => {
    const { result, onReset } = setup();
    act(() => result.current.onMainFrameNavigation("https://app.example.com/"));
    const previous = result.current.session;

    let accepted: unknown = "not called";
    act(() => {
      accepted = result.current.accept("https://other.example.com");
    });

    expect(accepted).toBeUndefined();
    expect(onReset).toHaveBeenCalledWith(previous);
    expect(result.current.session.origin).toBe("https://other.example.com");
    expect(result.current.accept("https://other.example.com")).toBe(result.current.session);
  });

  it("closes the session and rejects its pending requests on unmount", async () => {
    const { result, unmount, onReset } = setup();
    act(() => result.current.onMainFrameNavigation("https://app.example.com/"));
    const session = result.current.session;
    const pending = session.cancelOnClose(new Promise(() => {}));

    unmount();

    expect(session.isOpen).toBe(false);
    await expect(pending).rejects.toBeInstanceOf(BridgeSessionClosed);
    expect(onReset).not.toHaveBeenCalled();
  });

  it("serves an open session after a Strict Mode effect replay", () => {
    const { result } = renderHook(() => useBridgeSession({ postMessage: jest.fn() }), {
      wrapper: StrictMode,
    });

    expect(result.current.session.isOpen).toBe(true);
    expect(result.current.accept("https://app.example.com")).toBe(result.current.session);
  });
});
