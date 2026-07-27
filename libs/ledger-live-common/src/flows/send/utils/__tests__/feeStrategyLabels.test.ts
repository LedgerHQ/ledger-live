import { feeSelectorLabelKeySuffix } from "../feeStrategyLabels";

describe("feeSelectorLabelKeySuffix", () => {
  it("maps the empty strategy to the medium preset", () => {
    expect(feeSelectorLabelKeySuffix("")).toBe("medium");
  });

  it("maps the reserved strategy ids to their key suffixes", () => {
    expect(feeSelectorLabelKeySuffix("default")).toBe("defaultNetworkFee");
    expect(feeSelectorLabelKeySuffix("custom")).toBe("custom");
    expect(feeSelectorLabelKeySuffix("coinControl")).toBe("coinControl");
  });

  it("passes a preset id through unchanged", () => {
    expect(feeSelectorLabelKeySuffix("slow")).toBe("slow");
    expect(feeSelectorLabelKeySuffix("fast")).toBe("fast");
  });
});
