import type { NotificationPermissionStatus } from "@domain/entity-notification-prompt";

export const FIREBASE_AUTHORIZATION_STATUS = {
  NOT_DETERMINED: -1,
  DENIED: 0,
  AUTHORIZED: 1,
  PROVISIONAL: 2,
  EPHEMERAL: 3,
} as const;

export type FirebaseAuthorizationStatus =
  (typeof FIREBASE_AUTHORIZATION_STATUS)[keyof typeof FIREBASE_AUTHORIZATION_STATUS];

export const mapFirebaseAuthorizationStatusToNotificationPermissionStatus = (
  status: FirebaseAuthorizationStatus | null | undefined,
): NotificationPermissionStatus => {
  switch (status) {
    case FIREBASE_AUTHORIZATION_STATUS.AUTHORIZED:
      return "authorized";
    case FIREBASE_AUTHORIZATION_STATUS.PROVISIONAL:
      return "provisional";
    case FIREBASE_AUTHORIZATION_STATUS.EPHEMERAL:
      return "ephemeral";
    case FIREBASE_AUTHORIZATION_STATUS.DENIED:
      return "denied";
    case FIREBASE_AUTHORIZATION_STATUS.NOT_DETERMINED:
    case null:
    case undefined:
      return "not_determined";
  }
};
