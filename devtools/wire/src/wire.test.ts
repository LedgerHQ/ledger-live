import { buildTargetUrl, buildTransport, isMatch, isValidWsUrl } from "./wire";
import type { MessageMap, TransportProtocol, WebSocketLike } from "@devtools/transport";

const protocol: TransportProtocol<MessageMap> = {
  onReceive: jest.fn(),
};

function makeSocketFactory() {
  const socket: WebSocketLike = {
    send: jest.fn(),
    close: jest.fn(),
    onopen: null,
    onclose: null,
    onerror: null,
    onmessage: null,
  };
  return jest.fn(() => socket);
}

const BASE_OPTIONS = {
  hubUrl: "ws://localhost:9090",
  role: "host" as const,
  id: "app",
};

describe("isMatch", () => {
  it("should return true when all partial keys equal the origin", () => {
    expect(isMatch({ a: 1, b: 2 }, { a: 1 })).toBe(true);
  });

  it("should return false when a partial key differs from the origin", () => {
    expect(isMatch({ a: 1, b: 2 }, { a: 99 })).toBe(false);
  });

  it("should return true for an empty partial", () => {
    expect(isMatch({ a: 1 }, {})).toBe(true);
  });

  it("should treat NaN as equal to NaN", () => {
    expect(isMatch({ a: NaN }, { a: NaN })).toBe(true);
  });

  it("should distinguish +0 from -0", () => {
    expect(isMatch({ a: +0 }, { a: -0 })).toBe(false);
  });

  it("should only check keys present in partial, ignoring extra keys in origin", () => {
    expect(isMatch({ a: 1, b: 2, c: 3 }, { b: 2 })).toBe(true);
  });
});

describe("isValidWsUrl", () => {
  it("should return true for a valid ws URL with hostname", () => {
    expect(isValidWsUrl("ws://localhost:9090")).toBe(true);
  });

  it("should return true for a valid wss URL", () => {
    expect(isValidWsUrl("wss://example.com:9090")).toBe(true);
  });

  it("should return true for a valid IPv4 address", () => {
    expect(isValidWsUrl("ws://192.168.1.1:9090")).toBe(true);
  });

  it("should return false for a non-ws protocol", () => {
    expect(isValidWsUrl("http://localhost:9090")).toBe(false);
  });

  it("should return false when host is empty", () => {
    expect(isValidWsUrl("ws://:9090")).toBe(false);
  });

  it("should return false for a partial IP with a single number", () => {
    expect(isValidWsUrl("ws://127:9090")).toBe(false);
  });

  it("should return false for an incomplete IPv4 with trailing dot", () => {
    expect(isValidWsUrl("ws://192.168.1.:9090")).toBe(false);
  });

  it("should return false for an IPv4 with an octet out of range", () => {
    expect(isValidWsUrl("ws://192.168.1.256:9090")).toBe(false);
  });

  it("should return false for a malformed URL", () => {
    expect(isValidWsUrl("not-a-url")).toBe(false);
  });

  it("should return false when only the scheme is present", () => {
    expect(isValidWsUrl("ws://")).toBe(false);
  });

  it("should not update transport URL when setHubUrl is called with an invalid URL", () => {
    const socketFactory = makeSocketFactory();
    const wire = buildTransport({ ...BASE_OPTIONS, socketFactory }, protocol);
    const urlBefore = wire.transport.getState().url;
    wire.setHubUrl("ws://192.168.1.256:9090");
    expect(wire.transport.getState().url).toBe(urlBefore);
  });

  it("should not connect on init when the initial hubUrl is invalid", () => {
    const socketFactory = makeSocketFactory();
    buildTransport({ ...BASE_OPTIONS, hubUrl: "ws://192.168.1.256:9090", socketFactory }, protocol);
    expect(socketFactory).not.toHaveBeenCalled();
  });
});

describe("buildTargetUrl", () => {
  it("should include role and id in the query string", () => {
    const url = buildTargetUrl({ ...BASE_OPTIONS });
    const qs = new URLSearchParams(url.split("?")[1]);
    expect(qs.get("role")).toBe("host");
    expect(qs.get("id")).toBe("app");
  });

  it("should omit target when not provided", () => {
    const url = buildTargetUrl({ ...BASE_OPTIONS });
    expect(new URLSearchParams(url.split("?")[1]).has("target")).toBe(false);
  });

  it("should include target when provided", () => {
    const url = buildTargetUrl({ ...BASE_OPTIONS, target: "desktop" });
    expect(new URLSearchParams(url.split("?")[1]).get("target")).toBe("desktop");
  });

  it("should append with ? when the base URL has no query string", () => {
    expect(buildTargetUrl({ ...BASE_OPTIONS })).toMatch(/^ws:\/\/localhost:9090\?/);
  });

  it("should append with & when the base URL already has a query string", () => {
    expect(buildTargetUrl({ ...BASE_OPTIONS, hubUrl: "ws://localhost:9090?x=1" })).toMatch(
      /^ws:\/\/localhost:9090\?x=1&/,
    );
  });
});

describe("buildTransport", () => {
  it("should connect immediately", () => {
    const { transport } = buildTransport(
      { ...BASE_OPTIONS, socketFactory: makeSocketFactory() },
      protocol,
    );
    expect(transport.getState().status).toBe("connecting");
  });

  it("should use the assembled target URL", () => {
    const options = { ...BASE_OPTIONS, socketFactory: makeSocketFactory() };
    const { transport } = buildTransport(options, protocol);
    expect(transport.getState().url).toBe(buildTargetUrl(options));
  });

  it("getState should reflect initial options", () => {
    const wire = buildTransport(
      { ...BASE_OPTIONS, target: "desktop", socketFactory: makeSocketFactory() },
      protocol,
    );
    expect(wire.getState()).toEqual({
      hubUrl: "ws://localhost:9090",
      role: "host",
      target: "desktop",
    });
  });

  it("setTarget should update state and recompute transport URL", () => {
    const wire = buildTransport({ ...BASE_OPTIONS, socketFactory: makeSocketFactory() }, protocol);
    wire.setTarget("desktop");
    expect(wire.getState().target).toBe("desktop");
    expect(new URLSearchParams(wire.transport.getState().url.split("?")[1]).get("target")).toBe(
      "desktop",
    );
  });

  it("setHubUrl should update state and recompute transport URL", () => {
    const wire = buildTransport({ ...BASE_OPTIONS, socketFactory: makeSocketFactory() }, protocol);
    wire.setHubUrl("ws://localhost:8080");
    expect(wire.getState().hubUrl).toBe("ws://localhost:8080");
    expect(wire.transport.getState().url).toMatch(/^ws:\/\/localhost:8080/);
  });

  it("subscribe should notify listeners on state change", () => {
    const wire = buildTransport({ ...BASE_OPTIONS, socketFactory: makeSocketFactory() }, protocol);
    const listener = jest.fn();
    wire.subscribe(listener);
    wire.setTarget("mobile");
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("subscribe should return an unsubscribe function", () => {
    const wire = buildTransport({ ...BASE_OPTIONS, socketFactory: makeSocketFactory() }, protocol);
    const listener = jest.fn();
    const unsubscribe = wire.subscribe(listener);
    unsubscribe();
    wire.setTarget("mobile");
    expect(listener).not.toHaveBeenCalled();
  });

  it("getState should return a stable reference until next update", () => {
    const wire = buildTransport({ ...BASE_OPTIONS, socketFactory: makeSocketFactory() }, protocol);
    expect(wire.getState()).toBe(wire.getState());
    wire.setTarget("mobile");
    expect(wire.getState().target).toBe("mobile");
  });
});
