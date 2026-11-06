function loadAppVersion({ os, detox }: { os: "ios" | "android"; detox?: string }): string {
  let appVersion = "";
  jest.isolateModules(() => {
    jest.doMock("../../../../package.json", () => ({ version: "3.99.0-nightly.4" }));
    jest.replaceProperty(require("react-native").Platform, "OS", os);
    require("react-native-config").default.DETOX = detox;
    appVersion = require("../appVersion").appVersion;
  });
  return appVersion;
}

describe("appVersion", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should report the native version when the build is not a Detox build", () => {
    expect(loadAppVersion({ os: "android" })).toBe("1.0.0");
  });

  it("should report the package.json version when the build is an Android Detox build", () => {
    expect(loadAppVersion({ os: "android", detox: "1" })).toBe("3.99.0-nightly.4");
  });

  it("should drop the prerelease suffix like fastlane when the build is an iOS Detox build", () => {
    expect(loadAppVersion({ os: "ios", detox: "1" })).toBe("3.99.0");
  });
});
