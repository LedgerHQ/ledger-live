import React from "react";

import type { Card as BrazeCard } from "@braze/web-sdk";
import { logCardDismissal, logContentCardClick, ClassicCard } from "@braze/web-sdk";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { LARGE_SCREEN_UPSELL_UTM } from "@features/flow-large-screen-upsell";
import { fireEvent, render, screen } from "tests/testSetup";
import { track, trackPage } from "~/renderer/analytics/segment";
import { ContentCardEvent } from "@ledgerhq/live-common/braze/contentCardExtras";
import { openURL } from "~/renderer/linking";
import {
  CategoryContentCard,
  ContentCardsLayout,
  ContentCardsType,
  LocationContentCard,
} from "~/types/dynamicContent";
import ContentCardsLocation from "../components/ContentCardsLocation";
import PortfolioCategoryContentCards from "../components/PortfolioCategoryContentCards";
import { INITIAL_STATE as DYNAMIC_CONTENT_INITIAL_STATE } from "~/renderer/reducers/dynamicContent";

jest.mock("@braze/web-sdk", () => {
  class ClassicCard {
    id: string;
    extras: Record<string, unknown>;
    url?: string;

    constructor(id: string, extras: Record<string, unknown>) {
      this.id = id;
      this.extras = extras;
    }
  }

  return {
    ClassicCard,
    getCachedContentCards: jest.fn(),
    logCardDismissal: jest.fn(),
    logContentCardClick: jest.fn(),
  };
});

jest.mock("~/renderer/analytics/segment", () => ({
  ...jest.requireActual("~/renderer/analytics/segment"),
  track: jest.fn(),
  trackPage: jest.fn(),
}));

jest.mock("~/renderer/linking", () => ({
  openURL: jest.fn(),
}));

const CATEGORY: CategoryContentCard = {
  id: "local-category-alwayson",
  categoryId: "alwayson",
  title: "Discover our devices",
  description: "Secure your assets with Ledger hardware wallets",
  location: LocationContentCard.Portfolio,
  cardsLayout: ContentCardsLayout.carousel,
  cardsType: ContentCardsType.smallSquare,
  type: ContentCardsType.category,
  created: new Date("2026-01-01"),
  isDismissable: true,
};

const childCard = (
  id: string,
  title: string,
  order: string,
  subDescription?: string,
  tag?: string,
): BrazeCard =>
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  ({
    id,
    created: new Date("2026-01-02"),
    extras: {
      platform: "desktop",
      type: ContentCardsType.smallSquare,
      categoryId: "alwayson",
      title,
      subDescription,
      tag,
      media: "https://example.com/device.png",
      mediaType: "image",
      link: "https://shop.ledger.com/products",
      order,
    },
  }) as unknown as BrazeCard;

const CHILD_CARDS = [
  childCard("child-stax", "Nano Pod", "1", "$50", "30% off"),
  childCard("child-flex", "Nano Case", "2", "$89"),
  childCard("child-nano", "Ledger Flex™", "3", "$249", "$50 off"),
];

const FIXED_CONSENT_DATE = "2026-01-01T00:00:00.000Z";

const trackedUserSettings = {
  shareAnalytics: true,
  sharePersonalizedRecommandations: true,
  lastAnalyticsConsentDate: FIXED_CONSENT_DATE,
  privacyPolicyVersion: 1,
};

const hardwareCarouselState = {
  dynamicContent: {
    ...DYNAMIC_CONTENT_INITIAL_STATE,
    localCategoriesCards: [CATEGORY],
    localCategoryChildCards: CHILD_CARDS,
  },
  settings: {
    ...trackedUserSettings,
    devicesModelList: [DeviceModelId.nanoX],
  },
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe("ContentCardsLocation", () => {
  test("renders the category header and hardware carousel cards", async () => {
    render(<ContentCardsLocation locationId={LocationContentCard.Portfolio} />, {
      initialState: {
        dynamicContent: {
          ...DYNAMIC_CONTENT_INITIAL_STATE,
          localCategoriesCards: [CATEGORY],
          localCategoryChildCards: CHILD_CARDS,
        },
        settings: {
          shareAnalytics: true,
          sharePersonalizedRecommandations: true,
          lastAnalyticsConsentDate: FIXED_CONSENT_DATE,
          privacyPolicyVersion: 1,
        },
      },
    });

    expect(await screen.findByText("Discover our devices")).toBeVisible();
    expect(
      screen.queryByText("Secure your assets with Ledger hardware wallets"),
    ).not.toBeInTheDocument();
    expect(screen.getByText("Nano Pod")).toBeVisible();
    expect(screen.getByText("Nano Case")).toBeVisible();
    expect(screen.getByText("Ledger Flex™")).toBeVisible();
    expect(screen.getByText("$50")).toBeVisible();
    expect(screen.getByTestId("category-carousel")).toBeVisible();
  });

  test("dismisses a child card from the carousel", async () => {
    const { user, store } = render(
      <ContentCardsLocation locationId={LocationContentCard.Portfolio} />,
      {
        initialState: {
          dynamicContent: {
            ...DYNAMIC_CONTENT_INITIAL_STATE,
            localCategoriesCards: [CATEGORY],
            localCategoryChildCards: CHILD_CARDS,
          },
          settings: {
            shareAnalytics: true,
            sharePersonalizedRecommandations: true,
            lastAnalyticsConsentDate: FIXED_CONSENT_DATE,
            privacyPolicyVersion: 1,
          },
        },
      },
    );

    await screen.findByText("Nano Pod");
    const closeButtons = screen.getAllByTestId("small-square-card-close");
    await user.click(closeButtons[0]);

    expect(store.getState().dynamicContent.localCategoryChildCards).toHaveLength(2);
    expect(screen.queryByText("Nano Pod")).not.toBeInTheDocument();
    expect(track).toHaveBeenCalledWith(
      ContentCardEvent.Dismissed,
      expect.objectContaining({
        campaign: "child-stax",
        contentcard: "Nano Pod",
      }),
    );
    expect(logCardDismissal).not.toHaveBeenCalled();
  });

  test("tracks click when a child card is clicked", async () => {
    const brazeCategory: CategoryContentCard = {
      ...CATEGORY,
      id: "category-1",
    };
    const desktopCards = CHILD_CARDS.map(card =>
      Object.assign(Object.create(ClassicCard.prototype), {
        id: card.id,
        extras: card.extras,
      }),
    );

    render(<ContentCardsLocation locationId={LocationContentCard.Portfolio} />, {
      initialState: {
        dynamicContent: {
          ...DYNAMIC_CONTENT_INITIAL_STATE,
          categoriesCards: [brazeCategory],
          desktopCards,
        },
        settings: {
          shareAnalytics: true,
          sharePersonalizedRecommandations: true,
          lastAnalyticsConsentDate: FIXED_CONSENT_DATE,
          privacyPolicyVersion: 1,
        },
      },
    });

    fireEvent.click(await screen.findByText("Nano Case"));

    expect(track).toHaveBeenCalledWith(
      ContentCardEvent.Clicked,
      expect.objectContaining({
        campaign: "child-flex",
        contentcard: "Nano Case",
        location: LocationContentCard.Portfolio,
      }),
    );
    expect(logContentCardClick).toHaveBeenCalled();
    expect(openURL).toHaveBeenCalledTimes(1);

    const openedUrl = new URL(jest.mocked(openURL).mock.calls[0]![0] as string);
    expect(openedUrl.origin + openedUrl.pathname).toBe("https://shop.ledger.com/products");
    expect(openedUrl.searchParams.get("utm_source")).toBe(
      LARGE_SCREEN_UPSELL_UTM.sourceByPlatform.desktop,
    );
    expect(openedUrl.searchParams.get("utm_medium")).toBe(LARGE_SCREEN_UPSELL_UTM.medium);
    expect(openedUrl.searchParams.get("utm_campaign")).toBe(LARGE_SCREEN_UPSELL_UTM.campaign);
    expect(openedUrl.searchParams.get("utm_content")).toBe(
      LARGE_SCREEN_UPSELL_UTM.content.hardware_carousel,
    );
  });

  test("tracks hardware carousel page impression when the category is shown", async () => {
    render(<ContentCardsLocation locationId={LocationContentCard.Portfolio} />, {
      initialState: hardwareCarouselState,
    });

    await screen.findByText("Discover our devices");

    expect(trackPage).toHaveBeenCalledWith(
      "carousel hardware",
      undefined,
      {
        name: "carousel hardware",
        deviceModel: "lnx",
        personalRecoOptIn: true,
        offerType: "discount",
        platform: "lwd",
      },
      true,
      false,
    );
  });

  test("tracks hardware carousel device click when a device card is clicked", async () => {
    render(<ContentCardsLocation locationId={LocationContentCard.Portfolio} />, {
      initialState: hardwareCarouselState,
    });

    fireEvent.click(await screen.findByText("Ledger Flex™"));

    expect(track).toHaveBeenCalledWith(
      "button_clicked",
      expect.objectContaining({
        button: "ledger flex",
        page: "carousel hardware",
        deviceModel: "lnx",
        platform: "lwd",
      }),
    );
  });

  test("tracks Gen5 device click for Nano Pod carousel titles", async () => {
    render(<ContentCardsLocation locationId={LocationContentCard.Portfolio} />, {
      initialState: hardwareCarouselState,
    });

    fireEvent.click(await screen.findByText("Nano Pod"));

    expect(track).toHaveBeenCalledWith(
      "button_clicked",
      expect.objectContaining({
        button: "ledger gen5",
        page: "carousel hardware",
        deviceModel: "lnx",
        platform: "lwd",
      }),
    );
  });

  test("tracks hardware carousel card dismiss when a child card is dismissed", async () => {
    const { user } = render(<ContentCardsLocation locationId={LocationContentCard.Portfolio} />, {
      initialState: hardwareCarouselState,
    });

    await screen.findByText("Nano Pod");
    const closeButtons = screen.getAllByTestId("small-square-card-close");
    await user.click(closeButtons[0]);

    expect(track).toHaveBeenCalledWith(
      "button_clicked",
      expect.objectContaining({
        button: "close",
        page: "carousel hardware",
        deviceModel: "lnx",
        platform: "lwd",
      }),
    );
  });

  test("renders the close all link for dismissable hardware carousel categories", async () => {
    render(<ContentCardsLocation locationId={LocationContentCard.Portfolio} />, {
      initialState: hardwareCarouselState,
    });

    await screen.findByText("Discover our devices");
    expect(screen.getByTestId("hardware-carousel-close-all")).toBeVisible();
    expect(screen.getByText("Close all")).toBeVisible();
  });

  test("dismisses all child cards when close all is clicked", async () => {
    const { user, store } = render(
      <ContentCardsLocation locationId={LocationContentCard.Portfolio} />,
      {
        initialState: {
          ...hardwareCarouselState,
          settings: {
            ...trackedUserSettings,
            devicesModelList: [DeviceModelId.nanoX],
          },
        },
      },
    );

    await screen.findByText("Nano Pod");
    await user.click(screen.getByTestId("hardware-carousel-close-all"));

    expect(store.getState().dynamicContent.localCategoryChildCards).toHaveLength(0);
    expect(screen.queryByTestId("content-cards-category")).not.toBeInTheDocument();
    expect(track).toHaveBeenCalledWith(
      "button_clicked",
      expect.objectContaining({
        button: "close all",
        page: "carousel hardware",
        deviceModel: "lnx",
        personalRecoOptIn: true,
        offerType: "discount",
        platform: "lwd",
      }),
    );
    expect(track).not.toHaveBeenCalledWith(ContentCardEvent.Dismissed, expect.anything());
  });
});

describe("PortfolioCategoryContentCards", () => {
  test("keeps the LNS upsell banner out of the hardware carousel", async () => {
    render(
      <PortfolioCategoryContentCards
        leadingSlide={<div data-testid="lns-upsell-banner">upsell</div>}
      />,
      { initialState: hardwareCarouselState },
    );

    await screen.findByText("Nano Pod");

    const banner = screen.getByTestId("lns-upsell-banner");
    const carousel = screen.getByTestId("category-carousel");

    expect(banner).toBeVisible();
    expect(carousel).not.toContainElement(banner);
    expect(banner.compareDocumentPosition(carousel)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
  });
});
