import { getSecurityRows } from "./securityRows";

const ids = (rows: ReturnType<typeof getSecurityRows>) => rows.map(row => row.id);

const NO_BIOMETRICS = { biometricKind: null, biometricsRequirePassword: false } as const;
const FACE_ID = { biometricKind: "faceId", biometricsRequirePassword: false } as const;
const FACE_ID_NEEDING_PASSWORD = {
  biometricKind: "faceId",
  biometricsRequirePassword: true,
} as const;

describe("getSecurityRows", () => {
  it("shows hide balance, App lock and MEV protection on desktop without a password", () => {
    const rows = getSecurityRows({ passwordSet: false, ...NO_BIOMETRICS }, "desktop");

    expect(ids(rows)).toEqual(["hideBalance", "appLock", "mevProtection"]);
  });

  it("adds Change password and Auto-lock after App lock once a password is set on desktop", () => {
    const rows = getSecurityRows({ passwordSet: true, ...NO_BIOMETRICS }, "desktop");

    expect(ids(rows)).toEqual([
      "hideBalance",
      "appLock",
      "changePassword",
      "autoLock",
      "mevProtection",
    ]);
  });

  it("does not show the desktop password rows on mobile", () => {
    const rows = getSecurityRows({ passwordSet: true, ...NO_BIOMETRICS }, "mobile");

    expect(ids(rows)).toEqual(["hideBalance", "appLock", "mevProtection"]);
  });

  it("shows biometrics on mobile between App lock and MEV protection", () => {
    const rows = getSecurityRows({ passwordSet: true, ...FACE_ID }, "mobile");

    expect(ids(rows)).toEqual(["hideBalance", "appLock", "biometrics", "mevProtection"]);
  });

  it("keeps biometrics enabled without a password when it does not need one", () => {
    const rows = getSecurityRows({ passwordSet: false, ...FACE_ID }, "mobile");

    expect(rows.find(row => row.id === "biometrics")).toEqual({ id: "biometrics", enabled: true });
  });

  it("disables biometrics until a password is set when it needs one", () => {
    const withoutPassword = getSecurityRows(
      { passwordSet: false, ...FACE_ID_NEEDING_PASSWORD },
      "mobile",
    );
    const withPassword = getSecurityRows(
      { passwordSet: true, ...FACE_ID_NEEDING_PASSWORD },
      "mobile",
    );

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
    const rows = getSecurityRows({ passwordSet: true, ...FACE_ID }, "desktop");

    expect(ids(rows)).not.toContain("biometrics");
  });
});
