import { type UserId, isDummyUserId } from "@domain/entity-client-identity";
import { generateAnonymousId } from "@ledgerhq/live-common/braze/anonymousUsers";

type ResolveDesktopBrazeUserIdArgs = {
  isTrackedUser: boolean;
  userId: UserId;
  anonymousBrazeId: string | null;
  brazeOptOutIdentityCleanup: boolean;
};

export function resolveDesktopBrazeUserId({
  isTrackedUser,
  userId,
  anonymousBrazeId,
  brazeOptOutIdentityCleanup,
}: ResolveDesktopBrazeUserIdArgs): string | null {
  if (isDummyUserId(userId)) return null;

  if (brazeOptOutIdentityCleanup) {
    return isTrackedUser ? userId.exportUserIdForBraze() : null;
  }

  return isTrackedUser
    ? userId.exportUserIdForBraze()
    : (anonymousBrazeId ?? generateAnonymousId());
}

export function shouldPersistAnonymousBrazeId(brazeOptOutIdentityCleanup: boolean): boolean {
  return !brazeOptOutIdentityCleanup;
}

export type LegacyAnonymousBrazeIdPersistenceAction = {
  type: "SET_ANONYMOUS_BRAZE_ID";
  payload: string;
};

export function ensureLegacyAnonymousBrazeIdStored(
  anonymousBrazeId: string | null,
  brazeOptOutIdentityCleanup: boolean,
): { anonymousBrazeId: string; action: LegacyAnonymousBrazeIdPersistenceAction } | null {
  if (!shouldPersistAnonymousBrazeId(brazeOptOutIdentityCleanup) || anonymousBrazeId) {
    return null;
  }

  const id = generateAnonymousId();
  return {
    anonymousBrazeId: id,
    action: { type: "SET_ANONYMOUS_BRAZE_ID", payload: id },
  };
}
