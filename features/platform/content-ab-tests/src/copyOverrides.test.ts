import { buildContentAbTestCopyOverrides } from "./copyOverrides";
import type { ContentAbTests } from "./parse";

describe("buildContentAbTestCopyOverrides", () => {
  it("merges copy from enabled experiments", () => {
    const payloads: ContentAbTests = {
      banner: {
        enabled: true,
        copy: {
          "portfolio.banner.title": "A better title",
          "portfolio.banner.description": "A better description",
        },
      },
      onboarding: {
        enabled: true,
        copy: {
          "onboarding.continue": "Get started",
        },
        trackingConfiguration: {
          ptxEventProperty: "variant",
          ptxEventValue: "b",
        },
      },
    };

    expect(buildContentAbTestCopyOverrides(payloads)).toEqual({
      "portfolio.banner.title": "A better title",
      "portfolio.banner.description": "A better description",
      "onboarding.continue": "Get started",
    });
  });

  it("excludes copy from disabled experiments", () => {
    const payloads: ContentAbTests = {
      disabled: {
        enabled: false,
        copy: { "portfolio.banner.title": "Hidden title" },
      },
    };

    expect(buildContentAbTestCopyOverrides(payloads)).toEqual({});
  });

  it("uses the last enabled experiment when copy keys overlap", () => {
    const payloads: ContentAbTests = {
      first: {
        enabled: true,
        copy: { "portfolio.banner.title": "First title" },
      },
      second: {
        enabled: true,
        copy: { "portfolio.banner.title": "Second title" },
      },
    };

    expect(buildContentAbTestCopyOverrides(payloads)).toEqual({
      "portfolio.banner.title": "Second title",
    });
  });
});
