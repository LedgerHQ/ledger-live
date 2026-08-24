import { type UserId, isDummyUserId } from "@domain/entity-client-identity";

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
  if (isTrackedUser) return userId.exportUserIdForBraze();
  return brazeOptOutIdentityCleanup ? null : anonymousBrazeId;
}
