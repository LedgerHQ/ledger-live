import { msg } from "./messages";

describe("msg", () => {
  it("listening includes the port", () => {
    expect(msg.listening(9090)).toContain("9090");
  });

  it("wifiUrl includes the URL", () => {
    expect(msg.wifiUrl("ws://1.2.3.4:9090")).toContain("ws://1.2.3.4:9090");
  });

  it("noWifiIp mentions Wi-Fi", () => {
    expect(msg.noWifiIp).toContain("Wi-Fi");
  });

  it("tokenRejected includes the remote address", () => {
    expect(msg.tokenRejected("192.168.1.1")).toContain("192.168.1.1");
  });

  it("invalidIdentity includes the URL", () => {
    expect(msg.invalidIdentity("/?role=bad")).toContain("/?role=bad");
  });

  it("sessionless includes the tool id", () => {
    expect(msg.sessionless("web-tools")).toContain("web-tools");
  });

  it("evicted includes the role and host id", () => {
    const m = msg.evicted("host", "app");
    expect(m).toContain("host");
    expect(m).toContain("app");
  });

  it("attached includes role, id, and host id", () => {
    const m = msg.attached("tool", "web-tools", "desktop");
    expect(m).toContain("tool");
    expect(m).toContain("web-tools");
    expect(m).toContain("desktop");
  });

  it("paired includes the host id", () => {
    expect(msg.paired("desktop")).toContain("desktop");
  });

  it("forwarded includes sender, peer role, and message kind", () => {
    const m = msg.forwarded("web-tools", "host", "text");
    expect(m).toContain("web-tools");
    expect(m).toContain("host");
    expect(m).toContain("text");
  });

  it("dropped includes the sender id and missing peer role", () => {
    const m = msg.dropped("web-tools", "text", "host");
    expect(m).toContain("web-tools");
    expect(m).toContain("host");
  });

  it("disconnectedPeer includes role, id, and host id", () => {
    const m = msg.disconnectedPeer("tool", "web-tools", "desktop");
    expect(m).toContain("tool");
    expect(m).toContain("web-tools");
    expect(m).toContain("desktop");
  });

  it("disconnected includes the tool id", () => {
    expect(msg.disconnected("web-tools")).toContain("web-tools");
  });

  it("socketError includes the error message", () => {
    expect(msg.socketError("connection reset")).toContain("connection reset");
  });

  it("serverError includes the error message", () => {
    expect(msg.serverError("EADDRINUSE")).toContain("EADDRINUSE");
  });
});
