import { pushDevicesApi, pushDevicesApiExtra } from "./api";

const valid = { pushDevicesServiceUrl: "https://push.test", ledgerClientVersion: "1.2.3" };

describe("pushDevicesApi", () => {
  it("has the correct reducer path", () => {
    expect(pushDevicesApi.reducerPath).toBe("pushDevicesApi");
  });

  it("declares no endpoints of its own", () => {
    expect(Object.keys(pushDevicesApi.endpoints)).toHaveLength(0);
  });
});

describe("pushDevicesApiExtra", () => {
  it("returns the validated config", () => {
    expect(pushDevicesApiExtra(valid)).toEqual(valid);
  });

  it("trims the service url and allows it to be empty, which disables sync", () => {
    expect(pushDevicesApiExtra({ ...valid, pushDevicesServiceUrl: "  " })).toEqual({
      ...valid,
      pushDevicesServiceUrl: "",
    });
  });

  it("throws when the client version is missing or blank", () => {
    // @ts-expect-error — ledgerClientVersion is required
    expect(() => pushDevicesApiExtra({ pushDevicesServiceUrl: "https://push.test" })).toThrow();
    expect(() => pushDevicesApiExtra({ ...valid, ledgerClientVersion: "  " })).toThrow();
  });
});
