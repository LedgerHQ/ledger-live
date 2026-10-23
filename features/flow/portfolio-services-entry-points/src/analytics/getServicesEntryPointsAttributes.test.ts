import { getServicesEntryPointsAttributes } from "./getServicesEntryPointsAttributes";

describe("getServicesEntryPointsAttributes", () => {
  it("reports the flag state and the services order", () => {
    expect(
      getServicesEntryPointsAttributes({
        enabled: true,
        params: { services: ["borrow", "perps"] },
      }),
    ).toEqual({ isEnabled: true, services: ["borrow", "perps"] });
  });

  it("reports a disabled flag with no services when the flag is not loaded", () => {
    expect(getServicesEntryPointsAttributes(null)).toEqual({ isEnabled: false, services: [] });
  });
});
