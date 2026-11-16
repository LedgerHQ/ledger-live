import { DEFAULT_KEYCHAIN_OBSERVABLE_RANGE, getKeychainObservableRange } from "./config";
import { cardanoCoinConfig } from "./fixtures/config";

describe("getKeychainObservableRange", () => {
  it("returns the configured range when it is a positive integer", () => {
    expect(getKeychainObservableRange({ ...cardanoCoinConfig, keychainObservableRange: 42 })).toBe(
      42,
    );
  });

  it.each([0, -5, 1.5, Number.NaN, undefined])(
    "falls back to the default range when the configured range is %p",
    keychainObservableRange => {
      expect(
        getKeychainObservableRange({
          ...cardanoCoinConfig,
          keychainObservableRange: keychainObservableRange as number,
        }),
      ).toBe(DEFAULT_KEYCHAIN_OBSERVABLE_RANGE);
    },
  );
});
