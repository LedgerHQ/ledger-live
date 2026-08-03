import { configureStore } from "@reduxjs/toolkit";
import { pushDevicesApi, pushDevicesApiExtra } from "@domain/api-services";
import { createPushDevicesRequest, pushDevicesSyncApi } from "./api";
import { DeviceId } from "@domain/entity-client-identity";

describe("pushDevicesApi configuration", () => {
  it("has the correct reducer path", () => {
    expect(pushDevicesApi.reducerPath).toBe("pushDevicesApi");
  });

  it("exposes the pushDevices mutation endpoint", () => {
    expect(pushDevicesSyncApi.endpoints.pushDevices).toBeDefined();
  });
});

describe("pushDevicesApiExtra", () => {
  it("returns the validated config", () => {
    const config = { pushDevicesServiceUrl: "https://push.test", ledgerClientVersion: "1.0.0" };
    expect(pushDevicesApiExtra(config)).toEqual(config);
  });

  it("accepts empty pushDevicesServiceUrl (sync disabled)", () => {
    expect(() =>
      pushDevicesApiExtra({ pushDevicesServiceUrl: "", ledgerClientVersion: "1.0.0" }),
    ).not.toThrow();
  });

  it("throws when ledgerClientVersion is empty", () => {
    expect(() =>
      pushDevicesApiExtra({ pushDevicesServiceUrl: "https://push.test", ledgerClientVersion: "" }),
    ).toThrow();
  });

  it("throws when fields are missing", () => {
    // @ts-expect-error — both fields required
    expect(() => pushDevicesApiExtra({})).toThrow();
  });
});

describe("createPushDevicesRequest", () => {
  it("maps userId and deviceIds into the API payload shape", () => {
    const d1 = new DeviceId("abc123");
    const d2 = new DeviceId("def456");
    const req = createPushDevicesRequest("user-uuid", [d1, d2]);
    expect(req.equipment_id).toBe("user-uuid");
    expect(req.devices).toEqual(["abc123", "def456"]);
  });

  it("produces empty devices array when no device IDs", () => {
    const req = createPushDevicesRequest("user-uuid", []);
    expect(req.devices).toHaveLength(0);
  });
});

describe("pushDevicesApi HTTP request", () => {
  let fetchSpy: jest.SpyInstance;

  const makeStore = () =>
    configureStore({
      reducer: { [pushDevicesApi.reducerPath]: pushDevicesApi.reducer },
      middleware: gdm =>
        gdm({
          thunk: {
            extraArgument: pushDevicesApiExtra({
              pushDevicesServiceUrl: "https://push.test",
              ledgerClientVersion: "1.2.3",
            }),
          },
        }).concat(pushDevicesApi.middleware),
    });

  afterEach(() => {
    fetchSpy?.mockRestore();
  });

  it("returns CUSTOM_ERROR immediately when pushDevicesApiExtra is not in extraArgument", async () => {
    const bareStore = configureStore({
      reducer: { [pushDevicesApi.reducerPath]: pushDevicesApi.reducer },
      middleware: gdm => gdm().concat(pushDevicesApi.middleware),
    });
    const result = await bareStore.dispatch(
      pushDevicesSyncApi.endpoints.pushDevices.initiate({ equipment_id: "u", devices: [] }),
    );
    expect(result.error).toMatchObject({
      status: "CUSTOM_ERROR",
      error: expect.stringContaining("pushDevicesApiExtra"),
    });
  });

  it("sends POST to /v2/pushdevices with correct URL and headers", async () => {
    fetchSpy = jest
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response(null, { status: 200 }));

    const store = makeStore();
    await store.dispatch(
      pushDevicesSyncApi.endpoints.pushDevices.initiate({
        equipment_id: "user-uuid",
        devices: ["device-1"],
      }),
    );

    const req = fetchSpy.mock.calls[0][0] as Request;
    expect(req.url).toBe("https://push.test/v2/pushdevices");
    expect(req.method).toBe("POST");
    expect(req.headers.get("Content-Type")).toBe("application/json");
    expect(req.headers.get("X-Ledger-Client-Version")).toBe("1.2.3");
  });
});
