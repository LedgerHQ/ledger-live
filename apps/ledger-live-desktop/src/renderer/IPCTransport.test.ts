import { transport as transportBridge } from "~/renderer/bridge";
import { TransportError } from "@ledgerhq/hw-transport";
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

const mockTransport = jest.mocked(transportBridge);

const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const REQUEST_ID = "test-request-id";

describe("IPCTransport", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("isSupported", () => {
    it("should resolve to true in a renderer", async () => {
      await expect(IPCTransport.isSupported()).resolves.toBe(true);
    });
  });

  describe("exchange", () => {
    const transport = () => new IPCTransport("http-proxy", REQUEST_ID);

    it("should send the APDU as hex with its timeout and return the response as a Buffer", async () => {
      mockTransport.exchange.mockResolvedValue({
        type: "exchange-response",
        requestId: REQUEST_ID,
        data: "9000",
      });

      const response = await transport().exchange(Buffer.from([0xe0, 0x01, 0x00, 0x00]), {
        abortTimeoutMs: 5000,
      });

      expect(mockTransport.exchange).toHaveBeenCalledWith(REQUEST_ID, "e0010000", 5000);
      expect(Buffer.isBuffer(response)).toBe(true);
      expect(response.toString("hex")).toBe("9000");
    });

    it("should map an exchange-error result to a TransportError with its id", async () => {
      mockTransport.exchange.mockResolvedValue({
        type: "exchange-error",
        requestId: REQUEST_ID,
        error: { message: "device locked", id: "DeviceLocked" },
      });

      const error = await transport()
        .exchange(Buffer.from("e001", "hex"))
        .catch((e: unknown) => e);

      expect(error).toBeInstanceOf(TransportError);
      expect(error).toMatchObject({ message: "device locked", id: "DeviceLocked" });
    });

    it("should wrap a rejected bridge call in a TransportExchangeError", async () => {
      mockTransport.exchange.mockRejectedValue(new Error("ipc down"));

      const error = await transport()
        .exchange(Buffer.from("e001", "hex"))
        .catch((e: unknown) => e);

      expect(error).toBeInstanceOf(TransportError);
      expect(error).toMatchObject({ message: "ipc down", id: "TransportExchangeError" });
    });
  });

  describe("listen", () => {
    it("should listen with a uuid requestId and emit an add descriptor on success", async () => {
      const observer = { next: jest.fn(), error: jest.fn(), complete: jest.fn() };
      mockTransport.listen.mockResolvedValue({
        type: "listen-response",
        requestId: REQUEST_ID,
        data: { type: "add", descriptor: "http-proxy", device: {} },
      });

      const subscription = IPCTransport.listen(observer);

      expect(mockTransport.listen).toHaveBeenCalledWith(expect.stringMatching(UUID_V4));

      await new Promise(resolve => setImmediate(resolve));

      expect(observer.error).not.toHaveBeenCalled();
      expect(observer.next).toHaveBeenCalledWith(
        expect.objectContaining({ type: "add", descriptor: "http-proxy" }),
      );
      subscription.unsubscribe();
    });

    it("should surface a listen-error as a TransportError instead of a descriptor", async () => {
      const observer = { next: jest.fn(), error: jest.fn(), complete: jest.fn() };
      mockTransport.listen.mockResolvedValue({
        type: "listen-error",
        requestId: REQUEST_ID,
        error: { message: "no device found", id: "ListenFailed" },
      });

      const subscription = IPCTransport.listen(observer);

      await new Promise(resolve => setImmediate(resolve));

      expect(observer.next).not.toHaveBeenCalled();
      expect(observer.error).toHaveBeenCalledWith(expect.any(TransportError));
      expect(observer.error).toHaveBeenCalledWith(
        expect.objectContaining({ message: "no device found", id: "ListenFailed" }),
      );
      subscription.unsubscribe();
    });
  });

  describe("open", () => {
    it("should open with the descriptor and a uuid requestId and return an IPCTransport", async () => {
      const descriptor = "http-proxy";
      mockTransport.open.mockResolvedValue({
        type: "open-response",
        requestId: REQUEST_ID,
        data: { descriptor },
      });

      const transport = await IPCTransport.open(descriptor);

      expect(transport).toBeInstanceOf(IPCTransport);
      expect(mockTransport.open).toHaveBeenCalledWith(
        expect.stringMatching(UUID_V4),
        descriptor,
        undefined,
      );
    });

    it("should reject with the main-side message when the bridge resolves with open-error", async () => {
      mockTransport.open.mockResolvedValue({
        type: "open-error",
        requestId: REQUEST_ID,
        error: { message: "cannot open", id: "OpenFailed" },
      });

      await expect(IPCTransport.open("http-proxy")).rejects.toThrow("cannot open");
    });
  });
});
