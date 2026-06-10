import { buildOverridesExport } from "./exportOverrides";

describe("buildOverridesExport", () => {
  it("serializes the overrides as pretty-printed JSON", () => {
    const overrides = { mockFeature: { enabled: true } };

    const { content } = buildOverridesExport(overrides);

    expect(content).toBe(JSON.stringify(overrides, null, 2));
  });

  it("builds a dated json filename", () => {
    jest.useFakeTimers().setSystemTime(new Date("2026-06-05T10:00:00Z"));

    const { filename } = buildOverridesExport({});

    expect(filename).toBe("feature-flags-overrides-2026-06-05.json");

    jest.useRealTimers();
  });
});
