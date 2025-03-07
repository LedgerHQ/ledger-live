import { useSelector } from "react-redux";
import { useLNSUpsellBannerState } from "LLD/features/LNSUpsell";
import { notificationsContentCardSelector } from "../reducers/dynamicContent";
import { anonymousUserNotificationsSelector } from "../reducers/settings";

export function useUnseenNotificationsCount(): number {
  const notificationsCards = useSelector(notificationsContentCardSelector);
  const baseCount = notificationsCards?.filter(n => !n.viewed).length ?? 0;

  const anonymousUserNotifications = useSelector(anonymousUserNotificationsSelector);
  const isLNSNotifShown = useLNSUpsellBannerState("notification_center").isShown;
  const lnsBannerCount = isLNSNotifShown && !anonymousUserNotifications.LNSUpsell ? 1 : 0;

  return baseCount + lnsBannerCount;
}
