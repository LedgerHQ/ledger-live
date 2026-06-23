import { BehaviorSubject, firstValueFrom } from "rxjs";
import { skip } from "rxjs/operators";
import { ApduResponse, DeviceModelId, type TransportArgs } from "@ledgerhq/device-management-kit";
import {
  buildHttpProxyLegacyDeviceId,
  HTTP_PROXY_TRANSPORT_IDENTIFIER,
  HttpProxyDmkTransport,
} from "./HttpProxyDmkTransport";

const SYNTHETIC_DEVICE_ID = buildHttpProxyLegacyDeviceId("http://localhost:8435");

const mockDeviceModel = {
  model: DeviceModelId.NANO_X,
  name: "Nano X",
  id: DeviceModelId.NANO_X,
};

function createMockArgs(): TransportArgs {
  return {
    deviceModelDataSource: {
      getDeviceModel: jest.fn().mockReturnValue(mockDeviceModel),
    },
  } as unknown as TransportArgs;
}

const mockProxyMetadata = (deviceModelId: string | null = "nanoX") => {
  (global.fetch as jest.Mock).mockResolvedValueOnce({
    ok: true,
    json: async () => ({ deviceModelId }),
  });
};

describe("HttpProxyDmkTransport", () => {
  const url = "http://localhost:8435";
  let originalFetch: typeof global.fetch;
  let urlSubject: BehaviorSubject<string | null>;

  beforeEach(() => {
    originalFetch = global.fetch;
    jest.restoreAllMocks();
    global.fetch = jest.fn();
    urlSubject = new BehaviorSubject<string | null>(url);
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  describe("getIdentifier", () => {
    it("should return the HTTP proxy transport identifier", () => {
      const transport = new HttpProxyDmkTransport(createMockArgs(), urlSubject);
      expect(transport.getIdentifier()).toBe(HTTP_PROXY_TRANSPORT_IDENTIFIER);
    });
  });

  describe("isSupported", () => {
    it("should always return true", () => {
      const transport = new HttpProxyDmkTransport(createMockArgs(), urlSubject);
      expect(transport.isSupported()).toBe(true);
    });
  });

  describe("listenToAvailableDevices", () => {
    it("should emit the synthetic device when a URL is set", async () => {
      const transport = new HttpProxyDmkTransport(createMockArgs(), urlSubject);
      const emitted = await firstValueFrom(transport.listenToAvailableDevices());

      expect(emitted).toHaveLength(1);
      expect((emitted[0] as { id: string }).id).toBe(SYNTHETIC_DEVICE_ID);
    });

    it("should emit an empty list when the URL is null", async () => {
      urlSubject.next(null);
      const transport = new HttpProxyDmkTransport(createMockArgs(), urlSubject);
      const emitted = await firstValueFrom(transport.listenToAvailableDevices());

      expect(emitted).toHaveLength(0);
    });

    it("should re-emit when the URL subject changes", async () => {
      urlSubject.next(null);
      const transport = new HttpProxyDmkTransport(createMockArgs(), urlSubject);
      const nextEmission = firstValueFrom(transport.listenToAvailableDevices().pipe(skip(1)));

      urlSubject.next("http://other:9999");
      const emitted = await nextEmission;

      expect(emitted).toHaveLength(1);
      expect((emitted[0] as { id: string }).id).toBe(
        buildHttpProxyLegacyDeviceId("http://other:9999"),
      );
      expect((emitted[0] as { name: string }).name).toContain("http://other:9999");
    });
  });

  describe("startDiscovering", () => {
    it("should emit the synthetic device when a URL is set", async () => {
      const transport = new HttpProxyDmkTransport(createMockArgs(), urlSubject);
      const discovered = await firstValueFrom(transport.startDiscovering());

      expect((discovered as { id: string }).id).toBe(SYNTHETIC_DEVICE_ID);
      expect((discovered as { transport: string }).transport).toBe(HTTP_PROXY_TRANSPORT_IDENTIFIER);
    });

    it("should emit nothing when the URL is null", async () => {
      urlSubject.next(null);
      const transport = new HttpProxyDmkTransport(createMockArgs(), urlSubject);
      const discovered: unknown[] = [];

      transport.startDiscovering().subscribe({ next: d => discovered.push(d) });

      expect(discovered).toHaveLength(0);
    });
  });

  describe("stopDiscovering", () => {
    it("should not throw", () => {
      const transport = new HttpProxyDmkTransport(createMockArgs(), urlSubject);
      expect(() => transport.stopDiscovering()).not.toThrow();
    });
  });

  describe("disconnect", () => {
    it("should return Right(undefined)", async () => {
      const transport = new HttpProxyDmkTransport(createMockArgs(), urlSubject);
      const result = await transport.disconnect();
      expect(result.isRight()).toBe(true);
      expect(result.unsafeCoerce()).toBeUndefined();
    });
  });

  describe("connect", () => {
    it("should return Right with a TransportConnectedDevice", async () => {
      const transport = new HttpProxyDmkTransport(createMockArgs(), urlSubject);
      const result = await transport.connect({
        deviceId: SYNTHETIC_DEVICE_ID,
        onDisconnect: jest.fn(),
      });
      expect(result.isRight()).toBe(true);
    });

    it("should use the proxy metadata device model when connecting", async () => {
      const args = createMockArgs();
      mockProxyMetadata("stax");
      const transport = new HttpProxyDmkTransport(args, urlSubject);

      const result = await transport.connect({
        deviceId: SYNTHETIC_DEVICE_ID,
        onDisconnect: jest.fn(),
      });

      expect(result.isRight()).toBe(true);
      expect(args.deviceModelDataSource.getDeviceModel).toHaveBeenCalledWith({
        id: DeviceModelId.STAX,
      });
    });

    it("should fall back to the constructor device model when metadata is unavailable", async () => {
      const args = createMockArgs();
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error("metadata unavailable"));
      const transport = new HttpProxyDmkTransport(args, urlSubject, DeviceModelId.FLEX);

      const result = await transport.connect({
        deviceId: SYNTHETIC_DEVICE_ID,
        onDisconnect: jest.fn(),
      });

      expect(result.isRight()).toBe(true);
      expect(args.deviceModelDataSource.getDeviceModel).toHaveBeenCalledWith({
        id: DeviceModelId.FLEX,
      });
    });

    it("should return Left when the URL subject is null at connect time", async () => {
      urlSubject.next(null);
      const transport = new HttpProxyDmkTransport(createMockArgs(), urlSubject);
      const result = await transport.connect({
        deviceId: SYNTHETIC_DEVICE_ID,
        onDisconnect: jest.fn(),
      });
      expect(result.isLeft()).toBe(true);
    });

    describe("sendApdu", () => {
      async function getSendApdu(subject = urlSubject) {
        const transport = new HttpProxyDmkTransport(createMockArgs(), subject);
        const result = await transport.connect({
          deviceId: SYNTHETIC_DEVICE_ID,
          onDisconnect: jest.fn(),
        });
        return result.unsafeCoerce().sendApdu;
      }

      it("should POST the APDU as hex to the current URL", async () => {
        const sendApdu = await getSendApdu();
        (global.fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: "9000" }),
        });

        await sendApdu(Uint8Array.from([0xb0, 0x01, 0x00, 0x00, 0x00]));

        expect(global.fetch).toHaveBeenCalledWith(
          url,
          expect.objectContaining({
            method: "POST",
            body: JSON.stringify({ apduHex: "b001000000" }),
          }),
        );
      });

      it("should POST to the URL captured at connect time even if the subject changes after", async () => {
        const sendApdu = await getSendApdu();
        (global.fetch as jest.Mock).mockResolvedValue({
          ok: true,
          json: async () => ({ data: "9000" }),
        });

        urlSubject.next("http://new-host:1234");
        await sendApdu(Uint8Array.from([0x00]));

        expect(global.fetch).toHaveBeenCalledWith(url, expect.anything());
      });

      it("should return Right(ApduResponse) with data and statusCode split correctly", async () => {
        const sendApdu = await getSendApdu();
        (global.fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: "deadbeef9000" }),
        });

        const result = await sendApdu(Uint8Array.from([0xb0, 0x01, 0x00, 0x00, 0x00]));

        expect(result.isRight()).toBe(true);
        const response = result.unsafeCoerce() as ApduResponse;
        expect(Array.from(response.data)).toEqual([0xde, 0xad, 0xbe, 0xef]);
        expect(Array.from(response.statusCode)).toEqual([0x90, 0x00]);
      });

      it("should return Left when HTTP response is not ok", async () => {
        const sendApdu = await getSendApdu();
        (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: false, status: 500 });

        const result = await sendApdu(Uint8Array.from([0x00]));

        expect(result.isLeft()).toBe(true);
      });

      it("should return Left when body contains an error field", async () => {
        const sendApdu = await getSendApdu();
        (global.fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: async () => ({ error: "device busy" }),
        });

        const result = await sendApdu(Uint8Array.from([0x00]));

        expect(result.isLeft()).toBe(true);
      });

      it("should return Left when body.data is missing", async () => {
        const sendApdu = await getSendApdu();
        (global.fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: async () => ({}),
        });

        const result = await sendApdu(Uint8Array.from([0x00]));

        expect(result.isLeft()).toBe(true);
      });

      it("should return Left when body.data is not valid hex", async () => {
        const sendApdu = await getSendApdu();
        (global.fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: "not-hex" }),
        });

        const result = await sendApdu(Uint8Array.from([0x00]));

        expect(result.isLeft()).toBe(true);
      });

      it("should return Left when the response is shorter than a status code", async () => {
        const sendApdu = await getSendApdu();
        (global.fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: "90" }),
        });

        const result = await sendApdu(Uint8Array.from([0x00]));

        expect(result.isLeft()).toBe(true);
      });

      it("should return Left and NOT call onDisconnect when fetch throws", async () => {
        const transport = new HttpProxyDmkTransport(createMockArgs(), urlSubject);
        const onDisconnect = jest.fn();
        const connectResult = await transport.connect({
          deviceId: SYNTHETIC_DEVICE_ID,
          onDisconnect,
        });
        const sendApdu = connectResult.unsafeCoerce().sendApdu;

        (global.fetch as jest.Mock).mockRejectedValueOnce(new Error("Network error"));

        const result = await sendApdu(Uint8Array.from([0x00]));

        expect(result.isLeft()).toBe(true);
        expect(onDisconnect).not.toHaveBeenCalled();
      });
    });
  });

  describe("syntheticDevice", () => {
    it("should pass the custom deviceModelId to deviceModelDataSource.getDeviceModel", async () => {
      const args = createMockArgs();
      const transport = new HttpProxyDmkTransport(args, urlSubject, DeviceModelId.FLEX);

      await firstValueFrom(transport.listenToAvailableDevices());

      expect(args.deviceModelDataSource.getDeviceModel).toHaveBeenCalledWith({
        id: DeviceModelId.FLEX,
      });
    });

    it("should prefer the proxy metadata device model over the constructor fallback", async () => {
      const args = createMockArgs();
      mockProxyMetadata("stax");
      const transport = new HttpProxyDmkTransport(args, urlSubject, DeviceModelId.FLEX);

      await firstValueFrom(transport.listenToAvailableDevices());

      expect(args.deviceModelDataSource.getDeviceModel).toHaveBeenCalledWith({
        id: DeviceModelId.STAX,
      });
    });

    it("should default to NANO_X when no deviceModelId is provided", async () => {
      const args = createMockArgs();
      const transport = new HttpProxyDmkTransport(args, urlSubject);

      await firstValueFrom(transport.listenToAvailableDevices());

      expect(args.deviceModelDataSource.getDeviceModel).toHaveBeenCalledWith({
        id: DeviceModelId.NANO_X,
      });
    });

    it("should include the URL in the device name", async () => {
      const transport = new HttpProxyDmkTransport(createMockArgs(), urlSubject);
      const emitted = await firstValueFrom(transport.listenToAvailableDevices());

      expect((emitted[0] as { name: string }).name).toContain(url);
    });

    it("should encode the current URL in the legacy-compatible device id", async () => {
      const transport = new HttpProxyDmkTransport(createMockArgs(), urlSubject);
      const ids: string[] = [];

      await new Promise<void>((resolve, reject) => {
        const subscription = transport.listenToAvailableDevices().subscribe({
          next: list => {
            list.forEach(d => ids.push((d as { id: string }).id));

            if (ids.length === 1) {
              urlSubject.next("http://other:9999");
              return;
            }

            if (ids.length === 2) {
              subscription.unsubscribe();
              resolve();
            }
          },
          error: reject,
        });
      });

      expect(ids).toEqual([SYNTHETIC_DEVICE_ID, buildHttpProxyLegacyDeviceId("http://other:9999")]);
    });
  });
});
