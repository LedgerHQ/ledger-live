import { getLldWalletApiDeviceIntentSignAttributes } from "./getLldWalletApiDeviceIntentSignAttributes";

describe("getLldWalletApiDeviceIntentSignAttributes", () => {
  it("returns enabled false and undefined variant when the flag is missing", () => {
    expect(getLldWalletApiDeviceIntentSignAttributes(null)).toEqual({
      lldWalletApiDeviceIntentSignEnabled: false,
      lldWalletApiDeviceIntentSignVariant: undefined,
    });
  });

  it("returns enabled false and the variant when the flag is disabled", () => {
    expect(
      getLldWalletApiDeviceIntentSignAttributes({
        enabled: false,
        params: { variantId: "control", enabledManifestIds: [] },
      }),
    ).toEqual({
      lldWalletApiDeviceIntentSignEnabled: false,
      lldWalletApiDeviceIntentSignVariant: "control",
    });
  });

  it("returns enabled true and the variant when the flag is enabled", () => {
    expect(
      getLldWalletApiDeviceIntentSignAttributes({
        enabled: true,
        params: { variantId: "variant_a", enabledManifestIds: ["swap"] },
      }),
    ).toEqual({
      lldWalletApiDeviceIntentSignEnabled: true,
      lldWalletApiDeviceIntentSignVariant: "variant_a",
    });
  });

  it("returns enabled true and undefined variant when params are missing", () => {
    expect(
      getLldWalletApiDeviceIntentSignAttributes({
        enabled: true,
      }),
    ).toEqual({
      lldWalletApiDeviceIntentSignEnabled: true,
      lldWalletApiDeviceIntentSignVariant: undefined,
    });
  });
});
