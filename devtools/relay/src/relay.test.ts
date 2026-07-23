import { WebSocket } from "ws";
import type { AddressInfo } from "node:net";
import { createRelayHub } from "./relay";

type Hub = ReturnType<typeof createRelayHub>;

function waitForListening(hub: Hub): Promise<void> {
  return new Promise(resolve => hub.ws.once("listening", resolve));
}

function waitForOpen(ws: WebSocket): Promise<void> {
  return new Promise((resolve, reject) => {
    ws.once("open", resolve);
    ws.once("error", reject);
  });
}

function waitForMessage(ws: WebSocket): Promise<string> {
  return new Promise(resolve => ws.once("message", data => resolve(data.toString())));
}

function waitForClose(ws: WebSocket): Promise<void> {
  return new Promise(resolve => ws.once("close", resolve));
}

async function open(url: string): Promise<WebSocket> {
  const ws = new WebSocket(url);
  await waitForOpen(ws);
  return ws;
}

describe("relay hub — invalid connections", () => {
  let hub: Hub;
  let base: string;

  beforeEach(async () => {
    hub = createRelayHub({ port: 0, host: "127.0.0.1" });
    await waitForListening(hub);
    base = `ws://127.0.0.1:${(hub.ws.address() as AddressInfo).port}`;
  });

  afterEach(async () => {
    await hub.close();
  });

  it("closes a connection that has no identity query params", async () => {
    const ws = new WebSocket(base);
    await waitForClose(ws);
    expect(ws.readyState).toBe(WebSocket.CLOSED);
  });

  it("closes a connection with an invalid role", async () => {
    const ws = new WebSocket(`${base}/?role=admin&id=app`);
    await waitForClose(ws);
    expect(ws.readyState).toBe(WebSocket.CLOSED);
  });
});

describe("relay hub — message forwarding", () => {
  let hub: Hub;
  let base: string;

  beforeEach(async () => {
    hub = createRelayHub({ port: 0, host: "127.0.0.1" });
    await waitForListening(hub);
    base = `ws://127.0.0.1:${(hub.ws.address() as AddressInfo).port}`;
  });

  afterEach(async () => {
    await hub.close();
  });

  it("forwards a message from tool to host", async () => {
    const host = await open(`${base}/?role=host&id=app`);
    const tool = await open(`${base}/?role=tool&id=web-tools&target=app`);

    const incoming = waitForMessage(host);
    tool.send("hello");
    expect(await incoming).toBe("hello");

    host.close();
    tool.close();
  });

  it("forwards a message from host to tool", async () => {
    const host = await open(`${base}/?role=host&id=app`);
    const tool = await open(`${base}/?role=tool&id=web-tools&target=app`);

    const incoming = waitForMessage(tool);
    host.send("from-host");
    expect(await incoming).toBe("from-host");

    host.close();
    tool.close();
  });

  it("does not crash when a message is sent without a paired peer", async () => {
    const host = await open(`${base}/?role=host&id=app`);
    host.send("undeliverable");
    await new Promise<void>(resolve => setImmediate(resolve));
    expect(host.readyState).toBe(WebSocket.OPEN);
    host.close();
  });

  it("drops messages from a tool with no target", async () => {
    const tool = await open(`${base}/?role=tool&id=orphan`);
    tool.send("nowhere");
    await new Promise<void>(resolve => setImmediate(resolve));
    expect(tool.readyState).toBe(WebSocket.OPEN);
    tool.close();
  });
});

describe("relay hub — eviction", () => {
  let hub: Hub;
  let base: string;

  beforeEach(async () => {
    hub = createRelayHub({ port: 0, host: "127.0.0.1" });
    await waitForListening(hub);
    base = `ws://127.0.0.1:${(hub.ws.address() as AddressInfo).port}`;
  });

  afterEach(async () => {
    await hub.close();
  });

  it("closes the previous host when a new one reconnects with the same id", async () => {
    const host1 = await open(`${base}/?role=host&id=app`);
    const closed1 = waitForClose(host1);
    await open(`${base}/?role=host&id=app`);
    await closed1;
    expect(host1.readyState).toBe(WebSocket.CLOSED);
  });

  it("closes the previous tool when a new one reconnects targeting the same host", async () => {
    const tool1 = await open(`${base}/?role=tool&id=web-tools&target=app`);
    const closed1 = waitForClose(tool1);
    await open(`${base}/?role=tool&id=web-tools&target=app`);
    await closed1;
    expect(tool1.readyState).toBe(WebSocket.CLOSED);
  });
});
