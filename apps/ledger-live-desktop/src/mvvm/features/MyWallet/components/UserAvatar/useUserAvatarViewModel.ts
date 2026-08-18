import { useNotificationIndicator } from "LLD/components/TopBar/hooks/useNotificationIndicator";
import type { UserAvatarProps, UserAvatarViewProps } from "./types";

export function useUserAvatarViewModel({
  showNotification,
  unseenCount,
  ...rest
}: UserAvatarProps): UserAvatarViewProps {
  const { totalNotifCount } = useNotificationIndicator();

  const resolvedShow = showNotification === false ? false : totalNotifCount > 0;
  const resolvedCount = unseenCount ?? totalNotifCount;

  return {
    ...rest,
    showNotification: resolvedShow,
    unseenCount: resolvedShow ? resolvedCount : 0,
  };
}
