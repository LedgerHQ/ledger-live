/**
 * @jest-environment jsdom
 */
import { renderHook, waitFor } from "@testing-library/react";
import { BridgeSession } from "../wallet-api/bridgeSession";
import { useJSONRPCServer } from "./JSONRPCServer";

const request = (id: number, method: string) => JSON.stringify({ jsonrpc: "2.0", id, method });

describe("useJSONRPCServer", () => {
  it("answers a request on the session, posted to the session origin", async () => {
    const postMessage = jest.fn();
    const session = new BridgeSession("https://app.example.com", postMessage);
    const handlers = { "account.list": jest.fn(() => ["account"]) };
    renderHook(() => useJSONRPCServer(handlers, session));

    session.receive(request(1, "account.list"));

    await waitFor(() => expect(postMessage).toHaveBeenCalled());
    const [message, targetOrigin] = postMessage.mock.calls[0];
    expect(targetOrigin).toBe("https://app.example.com");
    expect(JSON.parse(message)).toEqual({ jsonrpc: "2.0", id: 1, result: ["account"] });
  });

  it("handles the messages received before its handlers were registered", async () => {
    const postMessage = jest.fn();
    const session = new BridgeSession("https://app.example.com", postMessage);
    session.receive(request(1, "currency.list"));

    renderHook(() => useJSONRPCServer({ "currency.list": () => ["bitcoin"] }, session));

    await waitFor(() => expect(postMessage).toHaveBeenCalledTimes(1));
  });

  it("never answers a request that was pending when the session closed", async () => {
    const postMessage = jest.fn();
    const session = new BridgeSession("https://app.example.com", postMessage);
    let resolve: (value: unknown) => void = () => {};
    const handlers = {
      "account.request": jest.fn(
        () =>
          new Promise(r => {
            resolve = r;
          }),
      ),
    };
    renderHook(() => useJSONRPCServer(handlers, session));

    session.receive(request(1, "account.request"));
    await waitFor(() => expect(handlers["account.request"]).toHaveBeenCalled());
    session.close();
    resolve("account");
    await new Promise(r => setTimeout(r, 0));

    expect(postMessage).not.toHaveBeenCalled();
  });

  it("hands each handler the session of its request", async () => {
    const session = new BridgeSession("https://app.example.com", jest.fn());
    const handlers = { "account.list": jest.fn(() => []) };
    renderHook(() => useJSONRPCServer(handlers, session));

    session.receive(request(1, "account.list"));

    await waitFor(() => expect(handlers["account.list"]).toHaveBeenCalled());
    expect(handlers["account.list"].mock.calls[0]).toContain(session);
  });

  it("ignores malformed messages", async () => {
    const postMessage = jest.fn();
    const session = new BridgeSession("https://app.example.com", postMessage);
    const handlers = { "account.list": jest.fn(() => []) };
    renderHook(() => useJSONRPCServer(handlers, session));

    session.receive("{not json");
    session.receive(request(2, "account.list"));

    await waitFor(() => expect(postMessage).toHaveBeenCalledTimes(1));
    expect(JSON.parse(postMessage.mock.calls[0][0]).id).toBe(2);
  });
});
