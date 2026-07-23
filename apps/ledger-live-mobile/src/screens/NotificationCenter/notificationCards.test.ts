import type { NotificationContentCard } from "~/dynamicContent/types";
import { ContentCardLocation } from "~/dynamicContent/types";
import { removeBrazeNotificationCard, splitNotificationCardsBySource } from "./notificationCards";

const notificationCard = (id: string): NotificationContentCard =>
  ({ id, title: id }) as unknown as NotificationContentCard;

const localCard = (id: string, location: ContentCardLocation) => ({
  id,
  extras: { location },
});

describe("notification cards", () => {
  it("should keep local notification cards separate from Braze cards", () => {
    const displayedCards = [
      notificationCard("braze"),
      notificationCard("local-notification"),
      notificationCard("shared-id"),
    ];
    const localMobileCards = [
      localCard("local-notification", ContentCardLocation.NotificationCenter),
      localCard("shared-id", ContentCardLocation.Asset),
    ];

    expect(splitNotificationCardsBySource(displayedCards, localMobileCards)).toEqual({
      brazeCards: [notificationCard("braze"), notificationCard("shared-id")],
      localCards: [notificationCard("local-notification")],
    });
    expect(removeBrazeNotificationCard(displayedCards, localMobileCards, "braze")).toEqual([
      notificationCard("shared-id"),
    ]);
  });
});
