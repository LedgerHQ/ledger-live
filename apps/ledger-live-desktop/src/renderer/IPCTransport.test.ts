import { ipcRenderer } from "electron";
import { DeviceModelId } from "@ledgerhq/types-devices";
import IPCTransport from "./IPCTransport";

jest.mock("electron", () => ({
  ipcRenderer: {
    invoke: jest.fn(),
  },
}));

jest.mock("@ledgerhq/logs", () => {
  const mockInstance = {
    trace: jest.fn(),
    withContext: jest.fn().mockReturnThis(),
    withType: jest.fn().mockReturnThis(),
  };
  return {
    log: jest.fn(),
    trace: jest.fn(),
    LocalTracer: jest.fn().mockImplementation(() => mockInstance),
  };
});

jest.mock("@ledgerhq/devices", () => ({
  getDeviceModel: jest.fn(() => ({ id: DeviceModelId.nanoS })),
}));

const mockInvoke = jest.mocked(ipcRenderer.invoke);

describe("IPCTransport", () => {
  beforeEach(() => {
    mockInvoke.mockReset();
  });

  describe("isSupported", () => {
    it("should resolve to true when ipcRenderer is an object", async () => {
      await expect(IPCTransport.isSupported()).resolves.toBe(true);
    });
  });

  describe("listen", () => {
    it("should call transport:listen with a uuid requestId and emit add descriptor on success", () => {
      const observer = { next: jest.fn(), error: jest.fn(), complete: jest.fn() };
      mockInvoke.mockImplementation((channel: string) => {
        if (channel === "transport:listen") {
          return Promise.resolve({ type: "listen-success" });
        }
        return Promise.resolve(undefined);
      });

      const subscription = IPCTransport.listen(observer);

      expect(mockInvoke).toHaveBeenCalledWith(
        "transport:listen",
        expect.objectContaining({
          requestId: expect.stringMatching(
            /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
          ),
        }),
      );

      return new Promise<void>(resolve => {
        setImmediate(() => {
          expect(observer.next).toHaveBeenCalledWith(
            expect.objectContaining({
              type: "add",
              descriptor: "http-proxy",
            }),
          );
          subscription.unsubscribe();
          resolve();
        });
      });
    });
  });

  describe("open", () => {
    it("should call transport:open with descriptor and uuid requestId and return IPCTransport instance", async () => {
      const descriptor = "http-proxy";
      mockInvoke.mockImplementation((channel: string) => {
        if (channel === "transport:open") return Promise.resolve({ type: "open-success" });
        return Promise.resolve(undefined);
      });

      const transport = await IPCTransport.open(descriptor);

      expect(transport).toBeInstanceOf(IPCTransport);
      const openCall = mockInvoke.mock.calls.find(c => c[0] === "transport:open");
      expect(openCall).toBeDefined();
      expect(openCall![1]).toMatchObject({
        descriptor,
      });
      expect(openCall![1].requestId).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
      );
    });
  });
});
