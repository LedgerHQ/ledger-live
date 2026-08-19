import { UserId, DUMMY_USER_ID } from "@domain/entity-client-identity";
import { generateAnonymousId } from "@ledgerhq/live-common/braze/anonymousUsers";
import { resolveDesktopBrazeUserId, shouldPersistAnonymousBrazeId } from "../brazeIdentity";

jest.mock("@ledgerhq/live-common/braze/anonymousUsers", () => ({
  generateAnonymousId: jest.fn(() => "anonymous_id_1"),
}));

const mockedGenerateAnonymousId = jest.mocked(generateAnonymousId);
const REAL_USER_ID = UserId.fromString("11111111-1111-1111-1111-111111111111");

describe("brazeIdentity", () => {
  beforeEach(() => {
    jest.clearAllMocks();
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
        expect(mockedGenerateAnonymousId).not.toHaveBeenCalled();
      });

      it("generates anonymous id when opted out and none persisted", () => {
        expect(
          resolveDesktopBrazeUserId({
            isTrackedUser: false,
            userId: REAL_USER_ID,
            anonymousBrazeId: null,
            brazeOptOutIdentityCleanup: false,
          }),
        ).toBe("anonymous_id_1");
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
        expect(mockedGenerateAnonymousId).not.toHaveBeenCalled();
      });
    });
  });

  describe("shouldPersistAnonymousBrazeId", () => {
    it("returns true when flag is off", () => {
      expect(shouldPersistAnonymousBrazeId(false)).toBe(true);
    });

    it("returns false when flag is on", () => {
      expect(shouldPersistAnonymousBrazeId(true)).toBe(false);
    });
  });
});
