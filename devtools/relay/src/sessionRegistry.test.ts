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

  it("reports paired when a second tool attaches to a session that already has a host", () => {
    const registry = createSessionRegistry();
    const { uid } = attachHost(registry);
    registry.attach({ role: "tool", id: "web-tools", target: uid }, makeSocket());
    const result = registry.attach(
      { role: "tool", id: "web-tools-v2", target: uid },
      makeSocket(),
    ) as Extract<AttachResult, { status: "filed" }>;
    expect(result.paired).toBe(true);
  });
});

describe("sessionRegistry — peersOf", () => {
  it("returns undefined when only the host is attached", () => {
    const registry = createSessionRegistry();
    const { socket: host } = attachHost(registry);
    expect(registry.peersOf(host)).toBeUndefined();
  });

  it("returns a Set containing the tool from the host's perspective after pairing", () => {
    const registry = createSessionRegistry();
    const { socket: host, uid } = attachHost(registry);
    const tool = makeSocket();
    registry.attach({ role: "tool", id: "web-tools", target: uid }, tool);
    expect(registry.peersOf(host)).toEqual(new Set([tool]));
  });

  it("returns a Set containing the host from the tool's perspective after pairing", () => {
    const registry = createSessionRegistry();
    const { socket: host, uid } = attachHost(registry);
    const tool = makeSocket();
    registry.attach({ role: "tool", id: "web-tools", target: uid }, tool);
    expect(registry.peersOf(tool)).toEqual(new Set([host]));
  });

  it("host's peers include all connected tools", () => {
    const registry = createSessionRegistry();
    const { socket: host, uid } = attachHost(registry);
    const tool1 = makeSocket();
    const tool2 = makeSocket();
    registry.attach({ role: "tool", id: "web-tools", target: uid }, tool1);
    registry.attach({ role: "tool", id: "web-tools-v2", target: uid }, tool2);
    expect(registry.peersOf(host)).toEqual(new Set([tool1, tool2]));
  });

  it("each tool's peers include the host and its sibling tools but not itself", () => {
    const registry = createSessionRegistry();
    const { socket: host, uid } = attachHost(registry);
    const tool1 = makeSocket();
    const tool2 = makeSocket();
    registry.attach({ role: "tool", id: "web-tools", target: uid }, tool1);
    registry.attach({ role: "tool", id: "web-tools-v2", target: uid }, tool2);
    expect(registry.peersOf(tool1)).toEqual(new Set([host, tool2]));
    expect(registry.peersOf(tool2)).toEqual(new Set([host, tool1]));
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

  it("unpairs all tools when the host detaches", () => {
    const registry = createSessionRegistry();
    const { socket: host, uid } = attachHost(registry);
    const tool = makeSocket();
    registry.attach({ role: "tool", id: "web-tools", target: uid }, tool);
    registry.detach(host);
    expect(registry.peersOf(tool)).toBeUndefined();
  });

  it("removes the uid from the index when a host detaches", () => {
    const registry = createSessionRegistry();
    const { socket: host, uid } = attachHost(registry);
    registry.detach(host);
    const result = registry.attach({ role: "tool", id: "web-tools", target: uid }, makeSocket());
    expect(result).toEqual({ status: "sessionless" });
  });

  it("removes only the detached tool and keeps the rest paired", () => {
    const registry = createSessionRegistry();
    const { socket: host, uid } = attachHost(registry);
    const tool1 = makeSocket();
    const tool2 = makeSocket();
    registry.attach({ role: "tool", id: "web-tools", target: uid }, tool1);
    registry.attach({ role: "tool", id: "web-tools-v2", target: uid }, tool2);
    registry.detach(tool1);
    expect(registry.peersOf(tool2)).toEqual(new Set([host]));
    expect(registry.peersOf(host)).toEqual(new Set([tool2]));
    expect(registry.peersOf(tool1)).toBeUndefined();
  });

  it("drops the session once both host and all tools have detached", () => {
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
        paired: false,
      }),
    );
  });
});
