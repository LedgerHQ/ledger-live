import React from "react";
import { render, screen } from "tests/testSetup";
import { useRefreshAccountsOrderingEffect } from "~/renderer/actions/general";
import ActionContentCards from "~/renderer/screens/dashboard/ActionContentCards";
import { ActionContentCard, LocationContentCard } from "~/types/dynamicContent";

jest.mock("@braze/web-sdk", () =>
  jest
    .requireActual<typeof import("tests/mocks/brazeWebSdk")>("tests/mocks/brazeWebSdk")
    .getBrazeWebSdkJestMock(),
);

jest.mock("~/renderer/actions/general", () => ({
  ...jest.requireActual("~/renderer/actions/general"),
  useRefreshAccountsOrderingEffect: jest.fn(),
}));

const mockedUseRefreshAccountsOrderingEffect = jest.mocked(useRefreshAccountsOrderingEffect);

const trackingSettings = {
  shareAnalytics: true,
  sharePersonalizedRecommandations: true,
  lastAnalyticsConsentDate: new Date().toISOString(),
  privacyPolicyVersion: 1,
  orderAccounts: "balance|desc",
};

const emptyDynamicContent = {
  desktopCards: [] as unknown[],
  portfolioCards: [],
  bottomPortfolioCards: [],
  notificationsCards: [],
};

function initialStateWithActionCards(actionCards: ActionContentCard[]) {
  return {
    dynamicContent: {
      ...emptyDynamicContent,
      actionCards,
    },
    settings: trackingSettings,
  };
}

describe("ActionContentCards", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders dismiss link when action cards include secondaryCta", async () => {
    const actionCards: ActionContentCard[] = [
      {
        id: "ac-1",
        title: "Campaign",
        description: "Body",
        mainCta: "Open",
        secondaryCta: "Not interested",
        link: "https://example.com",
        created: null,
        isMock: true,
        location: LocationContentCard.Action,
      },
    ];

    render(<ActionContentCards />, {
      initialState: initialStateWithActionCards(actionCards),
    });

    expect(await screen.findByText(/not interested/i)).toBeVisible();
    expect(screen.getByRole("button", { name: "Open" })).toBeVisible();
    expect(mockedUseRefreshAccountsOrderingEffect).toHaveBeenCalledWith({ onMount: true });
  });

  it("omits dismiss link when action cards have no secondaryCta", async () => {
    const actionCards: ActionContentCard[] = [
      {
        id: "ac-2",
        title: "No secondary",
        description: "Body",
        mainCta: "Open only",
        link: "",
        created: null,
        isMock: true,
        location: LocationContentCard.Action,
      },
    ];

    render(<ActionContentCards />, {
      initialState: initialStateWithActionCards(actionCards),
    });

    expect(await screen.findByRole("button", { name: "Open only" })).toBeVisible();
    expect(screen.queryByText(/not interested/i)).not.toBeInTheDocument();
  });

  it("renders nothing when there are no action cards", () => {
    const { container } = render(<ActionContentCards />, {
      initialState: initialStateWithActionCards([]),
    });

    expect(container.firstChild).toBeNull();
  });
});
