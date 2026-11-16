import React from "react";
import { ClassicCard } from "@braze/web-sdk";
import { track } from "@shared/analytics";
import { ContentCardEvent } from "@ledgerhq/live-common/braze/contentCardExtras";
import { render, screen } from "tests/testSetup";
import { LocationContentCard } from "~/types/dynamicContent";
import { AnnouncementPanel } from "./AnnouncementPanel";

const CARD_ID = "nc-desktop-1";
const TITLE = "Recover your wallet";
const EXTRAS = {
  canvas_name: "Notification canvas",
  canvas_step_name: "Notification step",
  title: TITLE,
  description: "Set up Ledger Recover",
  url: "ledgerlive://recover",
  location: LocationContentCard.NotificationCenter,
};

const brazeCard = Object.assign(Object.create(ClassicCard.prototype), {
  id: CARD_ID,
  extras: EXTRAS,
  viewed: false,
});

const notificationCard = {
  id: CARD_ID,
  title: TITLE,
  description: EXTRAS.description,
  location: LocationContentCard.NotificationCenter,
  url: EXTRAS.url,
  viewed: false,
  created: new Date("2026-11-01T00:00:00.000Z"),
};

const trackingSettings = {
  shareAnalytics: true,
  sharePersonalizedRecommandations: true,
  lastAnalyticsConsentDate: new Date().toISOString(),
  privacyPolicyVersion: 1,
  devicesModelList: [],
  anonymousUserNotifications: {},
};

class VisibleIntersectionObserver {
  readonly callback: IntersectionObserverCallback;

  readonly root = null;

  readonly rootMargin = "";

  readonly thresholds = [0.5, 0.8];

  constructor(callback: IntersectionObserverCallback) {
    this.callback = callback;
  }

  observe() {
    this.callback(
      [{ intersectionRatio: 1, isIntersecting: true } as IntersectionObserverEntry],
      this as unknown as IntersectionObserver,
    );
  }

  unobserve() {}

  disconnect() {}

  takeRecords() {
    return [];
  }
}

const callsFor = (eventName: string) =>
  jest.mocked(track).mock.calls.filter(([event]) => event === eventName);

describe("AnnouncementPanel content cards", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.IntersectionObserver =
      VisibleIntersectionObserver as unknown as typeof IntersectionObserver;
  });

  it("should render the notification and track a click with the card payload", async () => {
    const { user } = render(<AnnouncementPanel />, {
      initialState: {
        dynamicContent: {
          desktopCards: [brazeCard],
          notificationsCards: [notificationCard],
        },
        settings: trackingSettings,
      },
    });

    expect(await screen.findByText(TITLE)).toBeVisible();

    await user.click(screen.getByText(TITLE));

    expect(callsFor(ContentCardEvent.Clicked)).toEqual([
      [
        ContentCardEvent.Clicked,
        {
          ...EXTRAS,
          contentcard: TITLE,
          link: EXTRAS.url,
          campaign: CARD_ID,
          page: LocationContentCard.NotificationCenter,
          location: LocationContentCard.NotificationCenter,
        },
      ],
    ]);
  });

  it("should track a card impression and a container impression when the card is visible", async () => {
    render(<AnnouncementPanel />, {
      initialState: {
        dynamicContent: {
          desktopCards: [brazeCard],
          notificationsCards: [notificationCard],
        },
        settings: trackingSettings,
      },
    });

    expect(await screen.findByText(TITLE)).toBeVisible();

    expect(callsFor(ContentCardEvent.Impression)).toEqual([
      [
        ContentCardEvent.Impression,
        {
          id: CARD_ID,
          ...EXTRAS,
        },
      ],
    ]);
    expect(callsFor("container_impression")).toEqual([
      [
        "container_impression",
        {
          page: "",
          location: LocationContentCard.NotificationCenter,
        },
      ],
    ]);
  });
});
