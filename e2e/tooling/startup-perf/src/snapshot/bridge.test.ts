import assert from "node:assert/strict";
import { once } from "node:events";
import { test } from "node:test";
import WebSocket from "ws";
import { startBridge, type Bridge } from "./bridge.ts";

/** The app's side, as client.ts connects: it acknowledges each message once handled. */
async function connectApp(bridge: Bridge, token = bridge.token, { ack = true } = {}) {
  const socket = new WebSocket(`ws://127.0.0.1:${bridge.port}/?token=${token}`);
  const received: Array<{ type: string; id: string; payload: string }> = [];
  socket.on("message", data => {
    const message = JSON.parse(String(data));
    received.push(message);
    if (ack) socket.send(JSON.stringify({ type: "ACK", id: message.id }));
  });
  return { socket, received };
}

test("sends a message to the connected app and resolves on its ACK", async () => {
  const bridge = await startBridge();
  try {
    const { socket, received } = await connectApp(bridge);
    await bridge.waitForApp(5_000);
    await bridge.send("addKnownSpeculos", '{"address":"https://s:443"}', 5_000);
    assert.equal(received.length, 1);
    assert.equal(received[0].type, "addKnownSpeculos");
    assert.equal(received[0].payload, '{"address":"https://s:443"}');
    socket.close();
  } finally {
    await bridge.close();
  }
});

test("refuses an app without the token", async () => {
  const bridge = await startBridge();
  try {
    const { socket } = await connectApp(bridge, "wrong");
    const [error] = await once(socket, "error");
    assert.match(String(error), /401/);
    await assert.rejects(bridge.waitForApp(200), /the app did not connect to the bridge/);
  } finally {
    await bridge.close();
  }
});

test("fails when the app never acknowledges, and when no app is connected", async () => {
  const bridge = await startBridge();
  try {
    await assert.rejects(bridge.send("addKnownSpeculos", "{}", 200), /no app connected/);
    const { socket } = await connectApp(bridge, bridge.token, { ack: false });
    await bridge.waitForApp(5_000);
    await assert.rejects(
      bridge.send("addKnownSpeculos", "{}", 200),
      /the app did not acknowledge addKnownSpeculos within 200 ms/,
    );
    socket.close();
  } finally {
    await bridge.close();
  }
});
