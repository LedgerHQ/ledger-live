import { useEffect } from "react";
import { useDispatch, useSelector } from "LLD/hooks/redux";
import { useLNSUpsellBannerState } from "LLD/features/LNSUpsell";
import { setNotificationsCards } from "~/renderer/actions/dynamicContent";
import { updateAnonymousUserNotifications } from "~/renderer/actions/settings";
import { notificationsContentCardSelector } from "~/renderer/reducers/dynamicContent";
import {
  anonymousUserNotificationsSelector,
  trackingEnabledSelector,
} from "~/renderer/reducers/settings";

/** Marks notification center cards read on open — mirrors mobile NotificationCenter mount behavior. */
export function useMarkNotificationsAsReadOnOpen() {
  const dispatch = useDispatch();
  const notificationsCards = useSelector(notificationsContentCardSelector);
  const isTrackedUser = useSelector(trackingEnabledSelector);
  const anonymousUserNotifications = useSelector(anonymousUserNotificationsSelector);
  const isLNSNotifShown = useLNSUpsellBannerState("notification_center").isShown;

  useEffect(() => {
    const unviewedCards = notificationsCards?.filter(n => !n.viewed) ?? [];
    const hasUnreadLnsUpsell = isLNSNotifShown && !anonymousUserNotifications.LNSUpsell;

    if (unviewedCards.length === 0 && !hasUnreadLnsUpsell) {
      return;
    }

    if (unviewedCards.length > 0) {
      dispatch(
        setNotificationsCards(
          notificationsCards!.map(n => (n.viewed ? n : { ...n, viewed: true })),
        ),
      );

      if (!isTrackedUser) {
        const unreadAnonymousNotifications = Object.fromEntries(
          unviewedCards
            .filter(n => anonymousUserNotifications[n.id] === undefined)
            .map(n => [n.id, Date.now()] as const),
        );
        if (Object.keys(unreadAnonymousNotifications).length > 0) {
          dispatch(
            updateAnonymousUserNotifications({ notifications: unreadAnonymousNotifications }),
          );
        }
      }
    }

    if (hasUnreadLnsUpsell) {
      dispatch(updateAnonymousUserNotifications({ notifications: { LNSUpsell: Date.now() } }));
    }
  }, [notificationsCards, isTrackedUser, anonymousUserNotifications, isLNSNotifShown, dispatch]);
}
