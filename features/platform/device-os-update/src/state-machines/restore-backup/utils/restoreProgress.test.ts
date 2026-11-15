import type { RestoreBackupDAIntermediateValue } from "@ledgerhq/dmk-ledger-wallet";
import { restoreProgress } from "./restoreProgress";

const at = (step: string, progress?: number) =>
  ({ step, progress }) as unknown as RestoreBackupDAIntermediateValue;

describe("restoreProgress", () => {
  it("should report nothing before the restore has started", () => {
    expect(restoreProgress(null)).toBe(0);
    expect(restoreProgress(undefined)).toBe(0);
  });

  it("should report nothing while the device is being prepared", () => {
    expect(restoreProgress(at("goToDashboard"))).toBe(0);
    expect(restoreProgress(at("requestMasterConsent"))).toBe(0);
  });

  it("should give the language pack the smallest share", () => {
    expect(restoreProgress(at("installLanguagePackage", 1))).toBeCloseTo(0.1);
  });

  it("should give the apps and their storage the largest share", () => {
    expect(restoreProgress(at("installOrUpdateApps", 0))).toBeCloseTo(0.1);
    expect(restoreProgress(at("restoreAppsStorage", 1))).toBeCloseTo(0.8);
  });

  it("should end on the custom lock screen", () => {
    expect(restoreProgress(at("uploadCustomLockScreen", 0))).toBeCloseTo(0.8);
    expect(restoreProgress(at("uploadCustomLockScreen", 1))).toBe(1);
  });

  it("should stay at the start of a phase that reports no progress of its own", () => {
    expect(restoreProgress(at("installOrUpdateApps"))).toBeCloseTo(0.1);
  });

  it("should advance within a phase", () => {
    expect(restoreProgress(at("installOrUpdateApps", 0.5))).toBeCloseTo(0.275);
  });
});
