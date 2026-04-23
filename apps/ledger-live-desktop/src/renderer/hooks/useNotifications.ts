import { ClassicCard } from "@braze/web-sdk";
import * as braze from "@braze/web-sdk";
import { useCallback } from "react";
import { useSelector } from "LLD/hooks/redux";

import { NotificationContentCard } from "~/types/dynamicContent";
import {
  desktopContentCardSelector,
  notificationsContentCardSelector,
} from "~/renderer/reducers/dynamicContent";
import { track } from "../analytics/segment";
import { trackingEnabledSelector } from "../reducers/settings";

export function useNotifications() {
  const desktopCards = useSelector(desktopContentCardSelector);
  const notificationsCards = useSelector(notificationsContentCardSelector);
  const isTrackedUser = useSelector(trackingEnabledSelector);

  const getBrazeCard = useCallback(
    (cardId: string) => desktopCards.find(card => card.id === cardId),
    [desktopCards],
  );

  // TODO use date library
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
      (sum: Record<string, NotificationContentCard[]>, notif: NotificationContentCard) => {
        // group by publication date
        const k = notif.created ? `${startOfDayTime(notif.created)}` : "no-date";
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

  const onClickNotif = useCallback(
    (card: NotificationContentCard) => {
      const currentCard = getBrazeCard(card.id);

      if (currentCard instanceof ClassicCard) {
        // For some reason braze won't log the click event if the card url is empty
        // Setting it as the card id just to have a dummy non empty value
        currentCard.url = currentCard.id;
        if (isTrackedUser) {
          braze.logContentCardClick(currentCard);
          track("contentcard_clicked", {
            ...currentCard.extras,
            contentcard: card.title,
            link: card.path || card.url,
            campaign: card.id,
            page: "notification_center",
            location: card.location,
          });
        }
      }
    },
    [getBrazeCard, isTrackedUser],
  );

  return {
    groupNotifications,
    startOfDayTime,
    braze,
    notificationsCards,
    onClickNotif,
  };
}
