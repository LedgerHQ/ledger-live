// The value is read once at import time, because `Platform.OS` cannot change under a running app.
// Each case therefore needs its own module registry, and a `Platform` mocked before that import.
describe("mobileWallet", () => {
  it.each([
    ["ios", "applePay"],
    ["android", "googlePay"],
  ] as const)("names the wallet of %s", async (os, expected) => {
    await jest.isolateModulesAsync(async () => {
      jest.doMock("react-native", () => ({ Platform: { OS: os } }));

      const { mobileWallet } = await import("../mobileWallet.native");

      expect(mobileWallet).toBe(expected);
    });
  });
});
