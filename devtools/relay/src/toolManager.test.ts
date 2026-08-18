import { WebSocket } from "ws";
import { createToolManager } from "./toolManager";

function makeMockSocket(readyState: number = WebSocket.OPEN) {
  return { readyState, send: jest.fn() };
}

function parseSent(mock: ReturnType<typeof makeMockSocket>) {
  const raw = mock.send.mock.calls[0][0] as string;
  return JSON.parse(raw);
}

describe("createToolManager — device registry", () => {
  it("should return an empty device list initially", () => {
    const tm = createToolManager();
    expect(tm.getDevices()).toEqual([]);
  });

  it("should expose a host device after addHost", () => {
    const tm = createToolManager();
    tm.addHost("uid-1", { id: "uid-1", name: "Nano S" });
    expect(tm.getDevices()).toEqual([{ id: "uid-1", name: "Nano S" }]);
  });

  it("should remove a host device after removeHost", () => {
    const tm = createToolManager();
    tm.addHost("uid-1", { id: "uid-1", name: "Nano S" });
    tm.removeHost("uid-1");
    expect(tm.getDevices()).toEqual([]);
  });

  it("should list all registered hosts when multiple have been added", () => {
    const tm = createToolManager();
    tm.addHost("uid-1", { id: "uid-1", name: "Nano S" });
    tm.addHost("uid-2", { id: "uid-2", name: "Nano X" });
    expect(tm.getDevices()).toHaveLength(2);
  });

  it("should overwrite a host entry when addHost is called with the same uid", () => {
    const tm = createToolManager();
    tm.addHost("uid-1", { id: "uid-1", name: "old name" });
    tm.addHost("uid-1", { id: "uid-1", name: "new name" });
    expect(tm.getDevices()).toEqual([{ id: "uid-1", name: "new name" }]);
  });
});

describe("createToolManager — sendDevicesTo", () => {
  it("should send the device list to an open socket", () => {
    const tm = createToolManager();
    tm.addHost("uid-1", { id: "uid-1", name: "Nano S" });
    const tool = makeMockSocket(WebSocket.OPEN);

    tm.sendDevicesTo(tool as unknown as WebSocket);

    expect(tool.send).toHaveBeenCalledTimes(1);
    const msg = parseSent(tool);
    expect(msg.kind).toBe("RetrieveConnectedDevicesMessages:devices");
    expect(msg.payload).toEqual([{ id: "uid-1", name: "Nano S" }]);
  });

  it("should not send to a socket that is not open", () => {
    const tm = createToolManager();
    tm.addHost("uid-1", { id: "uid-1", name: "Nano S" });
    const tool = makeMockSocket(WebSocket.CLOSED);

    tm.sendDevicesTo(tool as unknown as WebSocket);

    expect(tool.send).not.toHaveBeenCalled();
  });
});

describe("createToolManager — sendDevicesToAll", () => {
  it("should send the device list to every registered open tool", () => {
    const tm = createToolManager();
    tm.addHost("uid-1", { id: "uid-1", name: "Nano S" });
    const tool1 = makeMockSocket();
    const tool2 = makeMockSocket();
    tm.addTool(tool1 as unknown as WebSocket);
    tm.addTool(tool2 as unknown as WebSocket);

    tm.sendDevicesToAll();

    expect(tool1.send).toHaveBeenCalledTimes(1);
    expect(tool2.send).toHaveBeenCalledTimes(1);
  });

  it("should skip tools whose socket is not open", () => {
    const tm = createToolManager();
    tm.addHost("uid-1", { id: "uid-1", name: "Nano S" });
    const open = makeMockSocket(WebSocket.OPEN);
    const closed = makeMockSocket(WebSocket.CLOSED);
    tm.addTool(open as unknown as WebSocket);
    tm.addTool(closed as unknown as WebSocket);

    tm.sendDevicesToAll();

    expect(open.send).toHaveBeenCalledTimes(1);
    expect(closed.send).not.toHaveBeenCalled();
  });

  it("should not send to a tool after removeTool", () => {
    const tm = createToolManager();
    const tool = makeMockSocket();
    tm.addTool(tool as unknown as WebSocket);
    tm.removeTool(tool as unknown as WebSocket);

    tm.sendDevicesToAll();

    expect(tool.send).not.toHaveBeenCalled();
  });
});
