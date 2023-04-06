import * as braze from "@braze/web-sdk";
import { useCallback, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { LocationContentCard, NotificationContentCard, Platform } from "~/types/dynamicContent";
import { notificationsContentCardSelector } from "~/renderer/reducers/dynamicContent";
import { setNotificationsCards } from "~/renderer/actions/dynamicContent";
import { track } from "../analytics/segment";

export function useNotifications() {
  const [cachedNotifications, setCachedNotifications] = useState<braze.Card[]>([]);
  const dispatch = useDispatch();
  const notificationsCards = useSelector(notificationsContentCardSelector);

  useEffect(() => {
    const cards = braze
      .getCachedContentCards()
      .cards.filter(
        card =>
          card.extras?.platform === Platform.Desktop &&
          card.extras?.location === LocationContentCard.NotificationCenter,
      );
    setCachedNotifications(cards);
  }, []);

  function startOfDayTime(date: Date): number {
    const startOfDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    return startOfDate.getTime();
  }

  const groupNotifications = (
    notifs: NotificationContentCard[],
  ): {
    day: Date | null | undefined;
    data: NotificationContentCard[];
  }[] => {
    const notifsByDay: Record<string, NotificationContentCard[]> = notifs.reduce(
      (sum, notif: NotificationContentCard) => {
        // group by publication date
        const k = startOfDayTime(notif.createdAt);

        return { ...sum, [`${k}`]: [...(sum[k] || []), notif] };
      },
      {},
    );
    // map over the keyed groups and sort them by date
    return Object.keys(notifsByDay)
      .filter(
        key => notifsByDay[key] && notifsByDay[key].length > 0, // filter out potential empty groups
      )
      .map(key => Number(key)) // map every string to a number for sort evaluation
      .sort((a, b) => {
        const aa = a === 0 ? Infinity : a; // sort out by timestamp key while keeping priority set announcements on top
        const bb = b === 0 ? Infinity : b; // this can work because a and b cannot be equal to 0 at same time
        return bb - aa;
      })
      .map(date => ({
        day: date === 0 ? null : new Date(date),
        // format Day if available
        data: notifsByDay[`${date}`],
      }));
  };

  const logNotificationImpression = useCallback(
    (cardId: string) => {
      const currentCard = cachedNotifications.find(card => card.id === cardId);

      braze.logContentCardImpressions(currentCard ? [currentCard] : []);

      const cards = (notificationsCards ?? []).map(n => {
        if (n.id === cardId) {
          return { ...n, viewed: true };
        } else {
          return n;
        }
      });

      dispatch(setNotificationsCards(cards));
    },
    [notificationsCards, cachedNotifications, dispatch],
  );

  const onClickNotif = useCallback((card: NotificationContentCard) => {
    track("contentcard_clicked", {
      contentcard: card.title,
      link: card.path || card.url,
      campaign: card.id,
      page: "notification_center",
    });
  }, []);

  return {
    groupNotifications,
    startOfDayTime,
    braze,
    cachedNotifications,
    notificationsCards,
    logNotificationImpression,
    onClickNotif,
  };
}
