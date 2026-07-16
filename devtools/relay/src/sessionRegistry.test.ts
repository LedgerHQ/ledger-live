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

describe("sessionRegistry — attach", () => {
  it("returns sessionless when a tool has no target", () => {
    const registry = createSessionRegistry();
    const result = registry.attach(
      { role: "tool", id: "web-tools", target: undefined },
      makeSocket(),
    );
    expect(result).toEqual({ status: "sessionless" });
  });

  it("files a host without pairing when no tool exists yet", () => {
    const registry = createSessionRegistry();
    const result = registry.attach({ role: "host", id: "app" }, makeSocket());
    expect(result).toEqual({
      status: "filed",
      role: "host",
      hostId: "app",
      evicted: false,
      paired: false,
    });
  });

  it("files a tool without pairing when no host exists yet", () => {
    const registry = createSessionRegistry();
    const result = registry.attach({ role: "tool", id: "web-tools", target: "app" }, makeSocket());
    expect(result).toEqual({
      status: "filed",
      role: "tool",
      hostId: "app",
      evicted: false,
      paired: false,
    });
  });

  it("reports paired when both host and tool are attached", () => {
    const registry = createSessionRegistry();
    registry.attach({ role: "host", id: "app" }, makeSocket());
    const result = registry.attach(
      { role: "tool", id: "web-tools", target: "app" },
      makeSocket(),
    ) as Extract<AttachResult, { status: "filed" }>;
    expect(result.paired).toBe(true);
  });

  it("evicts the previous occupant of the same role", () => {
    const registry = createSessionRegistry();
    const first = makeSocket();
    registry.attach({ role: "host", id: "app" }, first);
    const result = registry.attach({ role: "host", id: "app" }, makeSocket()) as Extract<
      AttachResult,
      { status: "filed" }
    >;
    expect(first.closed).toBe(true);
    expect(result.evicted).toBe(true);
  });

  it("unpairs the evicted tool from its peer", () => {
    const registry = createSessionRegistry();
    const host = makeSocket();
    const tool1 = makeSocket();
    registry.attach({ role: "host", id: "app" }, host);
    registry.attach({ role: "tool", id: "web-tools", target: "app" }, tool1);
    registry.attach({ role: "tool", id: "web-tools-v2", target: "app" }, makeSocket());
    expect(registry.peerOf(tool1)).toBeUndefined();
  });
});

describe("sessionRegistry — peerOf", () => {
  it("returns undefined when only the host is attached", () => {
    const registry = createSessionRegistry();
    const host = makeSocket();
    registry.attach({ role: "host", id: "app" }, host);
    expect(registry.peerOf(host)).toBeUndefined();
  });

  it("returns the tool from the host's perspective after pairing", () => {
    const registry = createSessionRegistry();
    const host = makeSocket();
    const tool = makeSocket();
    registry.attach({ role: "host", id: "app" }, host);
    registry.attach({ role: "tool", id: "web-tools", target: "app" }, tool);
    expect(registry.peerOf(host)).toBe(tool);
  });

  it("returns the host from the tool's perspective after pairing", () => {
    const registry = createSessionRegistry();
    const host = makeSocket();
    const tool = makeSocket();
    registry.attach({ role: "host", id: "app" }, host);
    registry.attach({ role: "tool", id: "web-tools", target: "app" }, tool);
    expect(registry.peerOf(tool)).toBe(host);
  });
});

describe("sessionRegistry — detach", () => {
  it("returns undefined for an unknown socket", () => {
    const registry = createSessionRegistry();
    expect(registry.detach(makeSocket())).toBeUndefined();
  });

  it("returns role and hostId for a filed socket", () => {
    const registry = createSessionRegistry();
    const host = makeSocket();
    registry.attach({ role: "host", id: "app" }, host);
    expect(registry.detach(host)).toEqual({ role: "host", hostId: "app" });
  });

  it("unpairs the peer when a socket detaches", () => {
    const registry = createSessionRegistry();
    const host = makeSocket();
    const tool = makeSocket();
    registry.attach({ role: "host", id: "app" }, host);
    registry.attach({ role: "tool", id: "web-tools", target: "app" }, tool);
    registry.detach(host);
    expect(registry.peerOf(tool)).toBeUndefined();
  });

  it("does not clobber the replacement when a stale evicted socket is detached", () => {
    const registry = createSessionRegistry();
    const host1 = makeSocket();
    const tool = makeSocket();
    registry.attach({ role: "host", id: "app" }, host1);
    registry.attach({ role: "tool", id: "web-tools", target: "app" }, tool);
    const host2 = makeSocket();
    registry.attach({ role: "host", id: "app" }, host2);
    registry.detach(host1);
    expect(registry.peerOf(tool)).toBe(host2);
  });

  it("drops the session once both slots are detached", () => {
    const registry = createSessionRegistry();
    const host = makeSocket();
    const tool = makeSocket();
    registry.attach({ role: "host", id: "app" }, host);
    registry.attach({ role: "tool", id: "web-tools", target: "app" }, tool);
    registry.detach(host);
    registry.detach(tool);
    const newHost = makeSocket();
    const result = registry.attach({ role: "host", id: "app" }, newHost);
    expect(result).toEqual({
      status: "filed",
      role: "host",
      hostId: "app",
      evicted: false,
      paired: false,
    });
  });
});
