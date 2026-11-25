import { getSecurityRows } from "./securityRows";

const ids = (rows: ReturnType<typeof getSecurityRows>) => rows.map(row => row.id);

describe("getSecurityRows", () => {
  it("shows hide balance, App lock and MEV protection on desktop without a password", () => {
    const rows = getSecurityRows({ passwordSet: false, biometricKind: null }, "desktop");

    expect(ids(rows)).toEqual(["hideBalance", "appLock", "mevProtection"]);
  });

  it("adds Change password and Auto-lock after App lock once a password is set on desktop", () => {
    const rows = getSecurityRows({ passwordSet: true, biometricKind: null }, "desktop");

    expect(ids(rows)).toEqual([
      "hideBalance",
      "appLock",
      "changePassword",
      "autoLock",
      "mevProtection",
    ]);
  });

  it("does not show the desktop password rows on mobile", () => {
    const rows = getSecurityRows({ passwordSet: true, biometricKind: null }, "mobile");

    expect(ids(rows)).toEqual(["hideBalance", "appLock", "mevProtection"]);
  });

  it("shows biometrics on mobile when the device has them, enabled only with a password", () => {
    const withoutPassword = getSecurityRows(
      { passwordSet: false, biometricKind: "faceId" },
      "mobile",
    );
    const withPassword = getSecurityRows({ passwordSet: true, biometricKind: "faceId" }, "mobile");

    expect(withoutPassword.find(row => row.id === "biometrics")).toEqual({
      id: "biometrics",
      enabled: false,
    });
    expect(withPassword.find(row => row.id === "biometrics")).toEqual({
      id: "biometrics",
      enabled: true,
    });
  });

  it("never shows biometrics on desktop", () => {
    const rows = getSecurityRows({ passwordSet: true, biometricKind: "touchId" }, "desktop");

    expect(ids(rows)).not.toContain("biometrics");
  });
});
