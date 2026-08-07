import { createSessionRegistry } from "./sessionRegistry";
import type { AttachResult } from "./sessionRegistry";

function makeSocket() {
  return {
    closed: false,
    close() {
      this.closed = true;
    },
  };
}

function attachHost(registry: ReturnType<typeof createSessionRegistry>, id = "app") {
  const socket = makeSocket();
  const result = registry.attach({ role: "host", id }, socket) as Extract<
    AttachResult,
    { status: "filed" }
  >;
  return { socket, result, uid: result.descriptor!.uid };
}

describe("sessionRegistry — attach", () => {
  it("returns sessionless when a tool has no target", () => {
    const registry = createSessionRegistry();
    const result = registry.attach(
      { role: "tool", id: "web-tools", target: undefined },
      makeSocket(),
    );
    expect(result).toEqual({ status: "sessionless" });
  });

  it("returns sessionless when a tool targets an unknown uid", () => {
    const registry = createSessionRegistry();
    const result = registry.attach({ role: "tool", id: "web-tools", target: "999" }, makeSocket());
    expect(result).toEqual({ status: "sessionless" });
  });

  it("files a host and mints a descriptor", () => {
    const registry = createSessionRegistry();
    const { result } = attachHost(registry);
    expect(result).toEqual(
      expect.objectContaining({
        status: "filed",
        role: "host",
        evicted: false,
        paired: false,
        descriptor: expect.objectContaining({ uid: "1" }),
      }),
    );
  });

  it("reports paired when host then tool attach", () => {
    const registry = createSessionRegistry();
    const { uid } = attachHost(registry);
    const result = registry.attach(
      { role: "tool", id: "web-tools", target: uid },
      makeSocket(),
    ) as Extract<AttachResult, { status: "filed" }>;
    expect(result.paired).toBe(true);
  });

  it("evicts the previous tool when a new one targets the same uid", () => {
    const registry = createSessionRegistry();
    const { uid } = attachHost(registry);
    const first = makeSocket();
    registry.attach({ role: "tool", id: "web-tools", target: uid }, first);
    const result = registry.attach(
      { role: "tool", id: "web-tools-v2", target: uid },
      makeSocket(),
    ) as Extract<AttachResult, { status: "filed" }>;
    expect(first.closed).toBe(true);
    expect(result.evicted).toBe(true);
  });

  it("unpairs the evicted tool from its peer", () => {
    const registry = createSessionRegistry();
    const { socket: host, uid } = attachHost(registry);
    const tool1 = makeSocket();
    registry.attach({ role: "tool", id: "web-tools", target: uid }, tool1);
    registry.attach({ role: "tool", id: "web-tools-v2", target: uid }, makeSocket());
    expect(registry.peerOf(tool1)).toBeUndefined();
    host.close();
  });
});

describe("sessionRegistry — peerOf", () => {
  it("returns undefined when only the host is attached", () => {
    const registry = createSessionRegistry();
    const { socket: host } = attachHost(registry);
    expect(registry.peerOf(host)).toBeUndefined();
  });

  it("returns the tool from the host's perspective after pairing", () => {
    const registry = createSessionRegistry();
    const { socket: host, uid } = attachHost(registry);
    const tool = makeSocket();
    registry.attach({ role: "tool", id: "web-tools", target: uid }, tool);
    expect(registry.peerOf(host)).toBe(tool);
  });

  it("returns the host from the tool's perspective after pairing", () => {
    const registry = createSessionRegistry();
    const { socket: host, uid } = attachHost(registry);
    const tool = makeSocket();
    registry.attach({ role: "tool", id: "web-tools", target: uid }, tool);
    expect(registry.peerOf(tool)).toBe(host);
  });
});

describe("sessionRegistry — detach", () => {
  it("returns undefined for an unknown socket", () => {
    const registry = createSessionRegistry();
    expect(registry.detach(makeSocket())).toBeUndefined();
  });

  it("returns role and descriptor for a detached host", () => {
    const registry = createSessionRegistry();
    const { socket: host } = attachHost(registry);
    expect(registry.detach(host)).toEqual(
      expect.objectContaining({
        role: "host",
        descriptor: expect.objectContaining({ uid: "1" }),
      }),
    );
  });

  it("unpairs the peer when a socket detaches", () => {
    const registry = createSessionRegistry();
    const { socket: host, uid } = attachHost(registry);
    const tool = makeSocket();
    registry.attach({ role: "tool", id: "web-tools", target: uid }, tool);
    registry.detach(host);
    expect(registry.peerOf(tool)).toBeUndefined();
  });

  it("removes the uid from the index when a host detaches", () => {
    const registry = createSessionRegistry();
    const { socket: host, uid } = attachHost(registry);
    registry.detach(host);
    const result = registry.attach({ role: "tool", id: "web-tools", target: uid }, makeSocket());
    expect(result).toEqual({ status: "sessionless" });
  });

  it("drops the session once both slots are detached, allowing re-registration", () => {
    const registry = createSessionRegistry();
    const { socket: host, uid } = attachHost(registry);
    const tool = makeSocket();
    registry.attach({ role: "tool", id: "web-tools", target: uid }, tool);
    registry.detach(host);
    registry.detach(tool);
    const { result } = attachHost(registry);
    expect(result).toEqual(
      expect.objectContaining({
        status: "filed",
        role: "host",
        evicted: false,
        paired: false,
      }),
    );
  });
});
