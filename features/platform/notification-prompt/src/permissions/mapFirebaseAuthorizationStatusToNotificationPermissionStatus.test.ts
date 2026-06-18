import {
  FIREBASE_AUTHORIZATION_STATUS,
  mapFirebaseAuthorizationStatusToNotificationPermissionStatus,
} from "./mapFirebaseAuthorizationStatusToNotificationPermissionStatus";

describe("mapFirebaseAuthorizationStatusToNotificationPermissionStatus", () => {
  it("maps Firebase authorization statuses to domain permission statuses", () => {
    expect(
      mapFirebaseAuthorizationStatusToNotificationPermissionStatus(
        FIREBASE_AUTHORIZATION_STATUS.AUTHORIZED,
      ),
    ).toBe("authorized");
    expect(
      mapFirebaseAuthorizationStatusToNotificationPermissionStatus(
        FIREBASE_AUTHORIZATION_STATUS.PROVISIONAL,
      ),
    ).toBe("provisional");
    expect(
      mapFirebaseAuthorizationStatusToNotificationPermissionStatus(
        FIREBASE_AUTHORIZATION_STATUS.EPHEMERAL,
      ),
    ).toBe("ephemeral");
    expect(
      mapFirebaseAuthorizationStatusToNotificationPermissionStatus(
        FIREBASE_AUTHORIZATION_STATUS.DENIED,
      ),
    ).toBe("denied");
    expect(
      mapFirebaseAuthorizationStatusToNotificationPermissionStatus(
        FIREBASE_AUTHORIZATION_STATUS.NOT_DETERMINED,
      ),
    ).toBe("not_determined");
  });

  it("treats missing platform status as not determined", () => {
    expect(mapFirebaseAuthorizationStatusToNotificationPermissionStatus(null)).toBe(
      "not_determined",
    );
    expect(mapFirebaseAuthorizationStatusToNotificationPermissionStatus(undefined)).toBe(
      "not_determined",
    );
  });
});
