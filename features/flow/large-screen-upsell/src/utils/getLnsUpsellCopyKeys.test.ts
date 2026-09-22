import { getLnsUpsellCopyKeys } from "./getLnsUpsellCopyKeys";

describe("getLnsUpsellCopyKeys", () => {
  it("should use nanoS opted-out keys", () => {
    expect(
      getLnsUpsellCopyKeys({
        tracking: "opted_out",
        surface: "banner",
        deviceModelId: "nanoS",
      }),
    ).toEqual({
      title: "lnsUpsell.opted_out.nanoS.title",
      description: "lnsUpsell.opted_out.nanoS.description",
      cta: "lnsUpsell.opted_out.cta",
    });
    expect(
      getLnsUpsellCopyKeys({
        tracking: "opted_out",
        surface: "profile",
        deviceModelId: "nanoS",
      }),
    ).toEqual({
      title: "lnsUpsell.opted_out.nanoS.title",
      description: "lnsUpsell.opted_out.nanoS.description",
      cta: "lnsUpsell.profile.cta",
    });
  });

  it("should keep shared opted-out keys for other models", () => {
    expect(
      getLnsUpsellCopyKeys({
        tracking: "opted_out",
        surface: "profile",
        deviceModelId: "nanoSP",
      }),
    ).toEqual({
      title: "lnsUpsell.opted_out.title",
      description: "lnsUpsell.opted_out.description",
      cta: "lnsUpsell.profile.cta",
    });
  });

  it("should use nanoS opted-in keys on banner surfaces", () => {
    expect(
      getLnsUpsellCopyKeys({
        tracking: "opted_in",
        surface: "banner",
        deviceModelId: "nanoS",
      }),
    ).toEqual({
      title: "lnsUpsell.opted_in.nanoS.title",
      description: "lnsUpsell.opted_in.nanoS.description",
      cta: "lnsUpsell.opted_in.cta",
    });
  });

  it("should use nanoS profile keys on the profile surface", () => {
    expect(
      getLnsUpsellCopyKeys({
        tracking: "opted_in",
        surface: "profile",
        deviceModelId: "nanoS",
      }),
    ).toEqual({
      title: "lnsUpsell.profile.nanoS.title",
      description: "lnsUpsell.profile.nanoS.description",
      cta: "lnsUpsell.profile.cta",
    });
  });

  it("should keep shared opted-in keys for nanoSP and nanoX", () => {
    expect(
      getLnsUpsellCopyKeys({
        tracking: "opted_in",
        surface: "banner",
        deviceModelId: "nanoSP",
      }).title,
    ).toBe("lnsUpsell.opted_in.title");
    expect(
      getLnsUpsellCopyKeys({
        tracking: "opted_in",
        surface: "profile",
        deviceModelId: "nanoX",
      }).title,
    ).toBe("lnsUpsell.profile.title");
  });
});
