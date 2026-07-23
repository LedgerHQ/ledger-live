import { getDistributionChannel, isStoreDistribution } from "./distributionChannel";

// process.mas / process.windowsStore are set by the Electron binary variant and
// typed read-only, so drive them through a mutable view and restore afterwards.
const mutableProcess = process as unknown as { mas?: boolean; windowsStore?: boolean };
const originalMas = mutableProcess.mas;
const originalWindowsStore = mutableProcess.windowsStore;

afterEach(() => {
  mutableProcess.mas = originalMas;
  mutableProcess.windowsStore = originalWindowsStore;
});

describe("getDistributionChannel", () => {
  it("should return 'mac-app-store' when process.mas is set", () => {
    mutableProcess.mas = true;
    mutableProcess.windowsStore = undefined;
    expect(getDistributionChannel()).toBe("mac-app-store");
  });

  it("should return 'windows-store' when process.windowsStore is set", () => {
    mutableProcess.mas = undefined;
    mutableProcess.windowsStore = true;
    expect(getDistributionChannel()).toBe("windows-store");
  });

  it("should return 'direct' when neither store flag is set", () => {
    mutableProcess.mas = undefined;
    mutableProcess.windowsStore = undefined;
    expect(getDistributionChannel()).toBe("direct");
  });

  it("should prefer 'mac-app-store' when both store flags are set", () => {
    mutableProcess.mas = true;
    mutableProcess.windowsStore = true;
    expect(getDistributionChannel()).toBe("mac-app-store");
  });
});

describe("isStoreDistribution", () => {
  it("should be true for a Mac App Store build", () => {
    mutableProcess.mas = true;
    mutableProcess.windowsStore = undefined;
    expect(isStoreDistribution()).toBe(true);
  });

  it("should be true for a Windows Store build", () => {
    mutableProcess.mas = undefined;
    mutableProcess.windowsStore = true;
    expect(isStoreDistribution()).toBe(true);
  });

  it("should be false for a direct (CDN) build", () => {
    mutableProcess.mas = undefined;
    mutableProcess.windowsStore = undefined;
    expect(isStoreDistribution()).toBe(false);
  });
});
