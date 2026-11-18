import { getNewReceiveFlowAttributes } from "./getNewReceiveFlowAttributes";

describe("getNewReceiveFlowAttributes", () => {
  it("should send whether the flag is on, with its params", () => {
    expect(
      getNewReceiveFlowAttributes({ enabled: true, params: { excludedFamilies: ["canton"] } }),
    ).toEqual({ isEnabled: true, params: { excludedFamilies: ["canton"] } });
  });

  it("should send the flag off when it is unknown", () => {
    expect(getNewReceiveFlowAttributes(undefined)).toEqual({ isEnabled: false, params: undefined });
  });
});
