import { resolveAssetDetailSectionLoading } from "../resolveAssetDetailSectionLoading";

describe("resolveAssetDetailSectionLoading", () => {
  it("is true while distribution is loading and the section has no data", () => {
    expect(resolveAssetDetailSectionLoading(true, false, false)).toBe(true);
  });

  it("is false while distribution is loading when section data is already available", () => {
    expect(resolveAssetDetailSectionLoading(true, false, true)).toBe(false);
  });

  it("is true while market is loading and the section has no data", () => {
    expect(resolveAssetDetailSectionLoading(false, true, false)).toBe(true);
  });

  it("is false while market is loading when data is already available", () => {
    expect(resolveAssetDetailSectionLoading(false, true, true)).toBe(false);
  });
});
