// Hermes ships neither Intl.Locale nor Intl.PluralRules, while Node does. The PluralRules polyfill's
// best-fit locale matcher calls `new Intl.Locale`, so this suite removes the native one first.
describe("Intl polyfills on an engine without Intl.Locale", () => {
  beforeAll(() => {
    // @ts-expect-error -- simulate Hermes, which has no Intl.Locale
    delete Intl.Locale;
    jest.isolateModules(() => {
      require("./polyfill");
    });
  });

  it("constructs the ordinal PluralRules @mysten/sui builds at import time", () => {
    const rules = new Intl.PluralRules("en-US", { type: "ordinal" });
    expect([1, 2, 3, 4].map(n => rules.select(n))).toEqual(["one", "two", "few", "other"]);
  });
});
