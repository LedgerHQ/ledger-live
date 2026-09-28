import { UserId, DUMMY_USER_ID } from "@domain/entity-client-identity";
import { exportDesktopBrazeUserId, resolveDesktopBrazeUserId } from "../brazeIdentity";

const REAL_USER_ID = UserId.fromString("11111111-1111-1111-1111-111111111111");

describe("brazeIdentity", () => {
  describe("exportDesktopBrazeUserId", () => {
    it("returns null for dummy user id", () => {
      expect(exportDesktopBrazeUserId(DUMMY_USER_ID)).toBeNull();
    });

    it("returns the Braze export for a real user id", () => {
      expect(exportDesktopBrazeUserId(REAL_USER_ID)).toBe(REAL_USER_ID.exportUserIdForBraze());
    });
  });

  describe("resolveDesktopBrazeUserId", () => {
    it("returns null for dummy user id", () => {
      expect(
        resolveDesktopBrazeUserId({
          isTrackedUser: true,
          userId: DUMMY_USER_ID,
          anonymousBrazeId: null,
          brazeOptOutIdentityCleanup: true,
        }),
      ).toBeNull();
    });

    describe("when brazeOptOutIdentityCleanup is off (legacy)", () => {
      it("returns real id when tracked", () => {
        expect(
          resolveDesktopBrazeUserId({
            isTrackedUser: true,
            userId: REAL_USER_ID,
            anonymousBrazeId: "stored_anonymous",
            brazeOptOutIdentityCleanup: false,
          }),
        ).toBe(REAL_USER_ID.exportUserIdForBraze());
      });

      it("returns persisted anonymous id when opted out", () => {
        expect(
          resolveDesktopBrazeUserId({
            isTrackedUser: false,
            userId: REAL_USER_ID,
            anonymousBrazeId: "stored_anonymous",
            brazeOptOutIdentityCleanup: false,
          }),
        ).toBe("stored_anonymous");
      });

      it("returns null when opted out and no anonymous id is persisted", () => {
        expect(
          resolveDesktopBrazeUserId({
            isTrackedUser: false,
            userId: REAL_USER_ID,
            anonymousBrazeId: null,
            brazeOptOutIdentityCleanup: false,
          }),
        ).toBeNull();
      });
    });

    describe("when brazeOptOutIdentityCleanup is on", () => {
      it("returns real id when tracked", () => {
        expect(
          resolveDesktopBrazeUserId({
            isTrackedUser: true,
            userId: REAL_USER_ID,
            anonymousBrazeId: "stored_anonymous",
            brazeOptOutIdentityCleanup: true,
          }),
        ).toBe(REAL_USER_ID.exportUserIdForBraze());
      });

      it("returns null when opted out", () => {
        expect(
          resolveDesktopBrazeUserId({
            isTrackedUser: false,
            userId: REAL_USER_ID,
            anonymousBrazeId: "stored_anonymous",
            brazeOptOutIdentityCleanup: true,
          }),
        ).toBeNull();
      });
    });
  });
});
