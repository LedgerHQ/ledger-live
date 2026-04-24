import { useNotificationIndicator } from "LLD/components/TopBar/hooks/useNotificationIndicator";
import type { UserAvatarProps, UserAvatarViewProps } from "./types";

export function useUserAvatarViewModel({
  showNotification,
  unseenCount,
}: UserAvatarProps): UserAvatarViewProps {
  const { totalNotifCount } = useNotificationIndicator();

  const resolvedShow = showNotification === false ? false : totalNotifCount > 0;
  const resolvedCount = unseenCount ?? totalNotifCount;

  return {
    showNotification: resolvedShow,
    unseenCount: resolvedShow ? resolvedCount : 0,
  };
}
