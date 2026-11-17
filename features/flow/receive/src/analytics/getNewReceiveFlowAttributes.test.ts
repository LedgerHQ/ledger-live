import { getNewReceiveFlowAttributes } from "./getNewReceiveFlowAttributes";

describe("getNewReceiveFlowAttributes", () => {
  it("sends whether the flag is on, with its params", () => {
    expect(
      getNewReceiveFlowAttributes({ enabled: true, params: { excludedFamilies: ["canton"] } }),
    ).toEqual({ isEnabled: true, params: { excludedFamilies: ["canton"] } });
  });

  it("sends the flag off when it is unknown", () => {
    expect(getNewReceiveFlowAttributes(undefined)).toEqual({ isEnabled: false, params: undefined });
  });
});
