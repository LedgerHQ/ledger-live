import { applyRegionUpdate, isRegionUpdate } from "./regionUpdate";

describe("applyRegionUpdate", () => {
  it("stores a region, and en-US for a sanctioned one", () => {
    const effects = { setRegion: jest.fn() };

    applyRegionUpdate(effects, { key: "region", value: "fr-FR" });
    applyRegionUpdate(effects, { key: "region", value: "ru-RU" });

    expect(effects.setRegion.mock.calls).toEqual([["fr-FR"], ["en-US"]]);
  });
});

describe("isRegionUpdate", () => {
  it("is true for the region key only", () => {
    expect(isRegionUpdate({ key: "region" })).toBe(true);
    expect(isRegionUpdate({ key: "language" })).toBe(false);
  });
});
