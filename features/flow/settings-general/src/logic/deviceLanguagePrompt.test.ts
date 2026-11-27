import { shouldOfferDeviceLanguage } from "./deviceLanguagePrompt";

const FRENCH_ON_ENGLISH_DEVICE = {
  pickedLanguage: "french",
  availableLanguages: ["english", "french"],
  lastSeenDevice: { language: "english" },
};

describe("shouldOfferDeviceLanguage", () => {
  it("offers the picked language when the device can install it and shows another one", () => {
    expect(shouldOfferDeviceLanguage(FRENCH_ON_ENGLISH_DEVICE)).toBe(true);
  });

  it("does not offer it when the device already shows it", () => {
    expect(
      shouldOfferDeviceLanguage({
        ...FRENCH_ON_ENGLISH_DEVICE,
        lastSeenDevice: { language: "french" },
      }),
    ).toBe(false);
  });

  it("does not offer it when the device cannot install it", () => {
    expect(
      shouldOfferDeviceLanguage({ ...FRENCH_ON_ENGLISH_DEVICE, availableLanguages: ["english"] }),
    ).toBe(false);
  });

  it("does not offer a language no device supports", () => {
    expect(
      shouldOfferDeviceLanguage({ ...FRENCH_ON_ENGLISH_DEVICE, pickedLanguage: undefined }),
    ).toBe(false);
  });

  it("does not offer it when no device was seen", () => {
    expect(
      shouldOfferDeviceLanguage({ ...FRENCH_ON_ENGLISH_DEVICE, lastSeenDevice: undefined }),
    ).toBe(false);
  });

  it("offers it when the device language is unknown", () => {
    expect(
      shouldOfferDeviceLanguage({
        ...FRENCH_ON_ENGLISH_DEVICE,
        lastSeenDevice: { language: undefined },
      }),
    ).toBe(true);
  });
});
