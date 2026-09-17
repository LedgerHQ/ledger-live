import { type UserId, isDummyUserId } from "@domain/entity-client-identity";

type ResolveDesktopBrazeUserIdArgs = {
  isTrackedUser: boolean;
  userId: UserId;
  anonymousBrazeId: string | null;
  brazeOptOutIdentityCleanup: boolean;
};

export function exportDesktopBrazeUserId(userId: UserId): string | null {
  if (isDummyUserId(userId)) return null;
  return userId.exportUserIdForBraze();
}

export function resolveDesktopBrazeUserId({
  isTrackedUser,
  userId,
  anonymousBrazeId,
  brazeOptOutIdentityCleanup,
}: ResolveDesktopBrazeUserIdArgs): string | null {
  if (isTrackedUser) return exportDesktopBrazeUserId(userId);
  if (isDummyUserId(userId)) return null;
  return brazeOptOutIdentityCleanup ? null : anonymousBrazeId;
}
