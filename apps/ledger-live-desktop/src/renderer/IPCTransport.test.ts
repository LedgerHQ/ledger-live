import { transport as transportBridge } from "~/renderer/bridge";
import IPCTransport from "./IPCTransport";

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

jest.mock("@ledgerhq/devices", () => {
  const actual = jest.requireActual("@ledgerhq/devices");

  return {
    ...actual,
    getDeviceModel: jest.fn(() => ({ id: actual.DeviceModelId.nanoS })),
  };
});

// Asserting against named bridge methods rather than channel strings, so renaming a channel
// can no longer leave a test passing against a call that no longer happens.
const mockTransport = jest.mocked(transportBridge);

const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

describe("IPCTransport", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("isSupported", () => {
    it("should resolve to true in a renderer", async () => {
      await expect(IPCTransport.isSupported()).resolves.toBe(true);
    });
  });

  describe("listen", () => {
    it("should listen with a uuid requestId and emit an add descriptor on success", async () => {
      const observer = { next: jest.fn(), error: jest.fn(), complete: jest.fn() };
      mockTransport.listen.mockResolvedValue({
        type: "listen-success",
      } as unknown as Awaited<ReturnType<typeof transportBridge.listen>>);

      const subscription = IPCTransport.listen(observer);

      expect(mockTransport.listen).toHaveBeenCalledWith(expect.stringMatching(UUID_V4));

      // Let the promise chain inside listen() settle. Asserting after the await, rather than
      // inside the callback, makes a mismatch fail the test instead of timing it out.
      await new Promise(resolve => setImmediate(resolve));

      expect(observer.error).not.toHaveBeenCalled();
      expect(observer.next).toHaveBeenCalledWith(
        expect.objectContaining({ type: "add", descriptor: "http-proxy" }),
      );
      subscription.unsubscribe();
    });
  });

  describe("open", () => {
    it("should open with the descriptor and a uuid requestId and return an IPCTransport", async () => {
      const descriptor = "http-proxy";
      mockTransport.open.mockResolvedValue({
        type: "open-success",
      } as unknown as Awaited<ReturnType<typeof transportBridge.open>>);

      const transport = await IPCTransport.open(descriptor);

      expect(transport).toBeInstanceOf(IPCTransport);
      expect(mockTransport.open).toHaveBeenCalledWith(
        expect.stringMatching(UUID_V4),
        descriptor,
        undefined,
      );
    });
  });
});
