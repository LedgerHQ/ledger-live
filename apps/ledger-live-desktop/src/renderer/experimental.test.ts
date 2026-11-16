import { getExperimentalKeychainObservableRange } from "./experimental";

const storeExperimentalFlags = (flags: Record<string, unknown>) =>
  window.localStorage.setItem("experimentalFlags", JSON.stringify(flags));

describe("getExperimentalKeychainObservableRange", () => {
  const launchValue = process.env.KEYCHAIN_OBSERVABLE_RANGE;

  beforeEach(() => {
    delete process.env.KEYCHAIN_OBSERVABLE_RANGE;
    window.localStorage.removeItem("experimentalFlags");
  });

  afterAll(() => {
    if (launchValue === undefined) delete process.env.KEYCHAIN_OBSERVABLE_RANGE;
    else process.env.KEYCHAIN_OBSERVABLE_RANGE = launchValue;
    window.localStorage.removeItem("experimentalFlags");
  });

  it("returns the custom gap limit saved in the experimental settings", () => {
    storeExperimentalFlags({ KEYCHAIN_OBSERVABLE_RANGE: 50 });

    expect(getExperimentalKeychainObservableRange()).toBe(50);
  });

  it("prefers the value given at launch over the saved experimental setting", () => {
    storeExperimentalFlags({ KEYCHAIN_OBSERVABLE_RANGE: 50 });
    process.env.KEYCHAIN_OBSERVABLE_RANGE = "80";

    expect(getExperimentalKeychainObservableRange()).toBe(80);
  });

  it("returns undefined when no custom gap limit is set", () => {
    expect(getExperimentalKeychainObservableRange()).toBeUndefined();
  });

  it.each([2.5, "abc", null])(
    "returns undefined when the saved custom gap limit is %p",
    keychainObservableRange => {
      storeExperimentalFlags({ KEYCHAIN_OBSERVABLE_RANGE: keychainObservableRange });

      expect(getExperimentalKeychainObservableRange()).toBeUndefined();
    },
  );
});
