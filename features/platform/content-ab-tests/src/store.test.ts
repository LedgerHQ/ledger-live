import {
  clearContentAbTestOverrides,
  getContentAbTestCopyOverrides,
  getContentAbTests,
  hasContentAbTestOverrides,
  isContentAbTestOverridden,
  setContentAbTestOverride,
  setContentAbTests,
  subscribeToContentAbTests,
  subscribeToContentAbTestCopyOverrides,
} from "./store";

const sample = {
  test: { enabled: true, copy: { "upgrade.banner.title": "Hello" } },
};

describe("content AB tests store", () => {
  beforeEach(() => {
    clearContentAbTestOverrides();
    setContentAbTests({});
  });

  it("starts empty so app.json remains the default", () => {
    expect(getContentAbTests()).toEqual({});
  });

  it("publishes the latest payloads to subscribers", () => {
    const seen: unknown[] = [];
    const unsubscribe = subscribeToContentAbTests(payloads => {
      seen.push(payloads);
    });

    setContentAbTests(sample);
    unsubscribe();
    setContentAbTests({});

    expect(seen).toEqual([{}, sample]);
  });

  it("caches and publishes merged copy from enabled experiments", () => {
    const seen: unknown[] = [];
    const unsubscribe = subscribeToContentAbTestCopyOverrides(copy => {
      seen.push(copy);
    });

    setContentAbTests({
      enabled: { enabled: true, copy: { "upgrade.banner.title": "Remote title" } },
      disabled: { enabled: false, copy: { "upgrade.banner.cta": "Hidden CTA" } },
    });
    unsubscribe();

    expect(getContentAbTestCopyOverrides()).toEqual({
      "upgrade.banner.title": "Remote title",
    });
    expect(seen).toEqual([{ "upgrade.banner.title": "Remote title" }]);
  });

  it("keeps local overrides when remote payloads refresh", () => {
    setContentAbTests(sample);
    setContentAbTestOverride("test", {
      enabled: false,
      copy: { "upgrade.banner.title": "Mocked" },
    });

    setContentAbTests({
      test: { enabled: true, copy: { "upgrade.banner.title": "From remote" } },
    });

    expect(getContentAbTests()).toEqual({
      test: { enabled: false, copy: { "upgrade.banner.title": "Mocked" } },
    });
    expect(isContentAbTestOverridden("test")).toBe(true);
    expect(hasContentAbTestOverrides()).toBe(true);
  });

  it("restores a flag to the last remote payload", () => {
    setContentAbTests(sample);
    setContentAbTestOverride("test", { enabled: false, copy: {} });
    setContentAbTestOverride("test", undefined);

    expect(getContentAbTests()).toEqual(sample);
    expect(isContentAbTestOverridden("test")).toBe(false);
  });
});
