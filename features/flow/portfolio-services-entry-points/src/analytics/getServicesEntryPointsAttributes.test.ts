import { getServicesEntryPointsAttributes } from "./getServicesEntryPointsAttributes";

describe("getServicesEntryPointsAttributes", () => {
  it("should report the flag state and the services order", () => {
    expect(
      getServicesEntryPointsAttributes({
        enabled: true,
        params: { services: ["borrow", "perps"] },
      }),
    ).toEqual({ isEnabled: true, services: ["borrow", "perps"] });
  });

  it("should report the default order when an enabled flag has no params", () => {
    expect(getServicesEntryPointsAttributes({ enabled: true })).toEqual({
      isEnabled: true,
      services: ["perps", "borrow"],
    });
  });

  it("should report a disabled flag with no services when the flag is not loaded", () => {
    expect(getServicesEntryPointsAttributes(null)).toEqual({ isEnabled: false, services: [] });
  });
});
