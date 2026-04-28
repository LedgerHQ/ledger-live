import { getEnv } from "@ledgerhq/live-env";
import { useNotificationIndicator } from "LLD/components/TopBar/hooks/useNotificationIndicator";
import type { UserAvatarProps, UserAvatarViewProps } from "./types";

export const MY_WALLET_AVATAR_USER_URL = `${getEnv("LW_ICONS_AVATARS_CDN_BASE_URL")}/black/user.png`;

export function useUserAvatarViewModel({
  showNotification,
  unseenCount,
  size,
}: UserAvatarProps): UserAvatarViewProps {
  const { totalNotifCount } = useNotificationIndicator();

  const resolvedShow = showNotification === false ? false : totalNotifCount > 0;
  const resolvedCount = unseenCount ?? totalNotifCount;

  return {
    showNotification: resolvedShow,
    unseenCount: resolvedShow ? resolvedCount : 0,
    size,
  };
}
