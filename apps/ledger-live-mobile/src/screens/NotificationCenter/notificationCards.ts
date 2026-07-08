import { ContentCardLocation, type NotificationContentCard } from "~/dynamicContent/types";

type LocalMobileCard = { id: string; extras: { location?: string } };

const getLocalNotificationCardIds = (localMobileCards: LocalMobileCard[]) =>
  new Set(
    localMobileCards
      .filter(card => card.extras.location === ContentCardLocation.NotificationCenter)
      .map(card => card.id),
  );

export function splitNotificationCardsBySource(
  notificationCards: NotificationContentCard[],
  localMobileCards: LocalMobileCard[],
): {
  brazeCards: NotificationContentCard[];
  localCards: NotificationContentCard[];
} {
  const localNotificationCardIds = getLocalNotificationCardIds(localMobileCards);

  return {
    brazeCards: notificationCards.filter(card => !localNotificationCardIds.has(card.id)),
    localCards: notificationCards.filter(card => localNotificationCardIds.has(card.id)),
  };
}

export function isLocalNotificationCard(
  localMobileCards: LocalMobileCard[],
  cardId: string,
): boolean {
  return getLocalNotificationCardIds(localMobileCards).has(cardId);
}

export function removeBrazeNotificationCard(
  notificationCards: NotificationContentCard[],
  localMobileCards: LocalMobileCard[],
  cardId: string,
): NotificationContentCard[] {
  const localNotificationCardIds = getLocalNotificationCardIds(localMobileCards);

  return notificationCards.filter(
    card => card.id !== cardId && !localNotificationCardIds.has(card.id),
  );
}
