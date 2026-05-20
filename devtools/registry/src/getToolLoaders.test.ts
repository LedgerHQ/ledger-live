import { FEATURE_FLAGS_ID, parse } from "@devtools/core";
import { getToolLoaders } from "./index";

describe("getToolLoaders", () => {
  it("returns an empty map when given no ids", () => {
    expect(getToolLoaders([])).toEqual({});
  });

  it("returns the loader for a known id", () => {
    const loaders = getToolLoaders([FEATURE_FLAGS_ID]);
    expect(loaders[FEATURE_FLAGS_ID]).toBeInstanceOf(Function);
  });

  it("skips unknown ids silently", () => {
    const unknown = parse("definitely-not-registered");
    const loaders = getToolLoaders([unknown, FEATURE_FLAGS_ID]);
    expect(loaders[unknown]).toBeUndefined();
    expect(loaders[FEATURE_FLAGS_ID]).toBeInstanceOf(Function);
  });

  it("accepts any iterable, not only arrays", () => {
    const loaders = getToolLoaders(new Set([FEATURE_FLAGS_ID]));
    expect(Object.keys(loaders)).toEqual([FEATURE_FLAGS_ID]);
  });
});
