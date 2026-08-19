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
