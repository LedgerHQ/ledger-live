import React from "react";
import { Linking, Pressable, Text } from "react-native";
import type { ContentCard } from "@braze/react-native-sdk";
import type { WalletFeaturesConfig } from "@features/platform-feature-flags";
import * as useWalletFeaturesConfigModule from "@features/platform-feature-flags";
import { render, screen } from "@tests/test-renderer";
import { ContentCardEvent } from "@ledgerhq/live-common/braze/contentCardExtras";
import {
  CategoryContentCard,
  ContentCardLocation,
  ContentCardsLayout,
  ContentCardsType,
} from "~/dynamicContent/types";
import useDynamicContent from "../useDynamicContent";
import Layout from "./Layout";

jest.mock("../useDynamicContent");
jest.mock("@features/platform-feature-flags");
jest.mock("LLM/features/DynamicContent/components/LogContentCardWrapper", () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

jest.mock("~/contentCards/cards/utils", () => {
  const actual = jest.requireActual<typeof import("~/contentCards/cards/utils")>(
    "~/contentCards/cards/utils",
  );

  return {
    ...actual,
    contentCardItem: (
      _component: unknown,
      props: { metadata: { actions?: { onClick?: () => void; onDismiss?: () => void } } },
    ) => ({
      component: ({
        metadata,
      }: {
        metadata: { actions?: { onClick?: () => void; onDismiss?: () => void } };
      }) => (
        <>
          <Pressable testID="card-click" onPress={metadata.actions?.onClick}>
            <Text>click</Text>
          </Pressable>
          <Pressable testID="card-dismiss" onPress={metadata.actions?.onDismiss}>
            <Text>dismiss</Text>
          </Pressable>
        </>
      ),
      props,
    }),
  };
});

const mockUseDynamicContent = jest.mocked(useDynamicContent);
const mockUseWalletFeaturesConfig = jest.mocked(
  useWalletFeaturesConfigModule.useWalletFeaturesConfig,
);

const trackContentCardEvent = jest.fn().mockResolvedValue(undefined);
const logClickCard = jest.fn();
const dismissCard = jest.fn();

const createBrazeActionCard = (extras: ContentCard["extras"] = {}): ContentCard => ({
  id: "card-1",
  created: 1_690_112_400,
  expiresAt: -1,
  viewed: false,
  clicked: false,
  pinned: false,
  dismissed: false,
  dismissible: true,
  openURLInWebView: true,
  isControl: false,
  type: "Classic",
  title: "Braze title",
  cardDescription: "Action card description",
  extras: {
    type: "action",
    title: "Promo title",
    description: "Promo body",
    link: "https://example.com",
    order: "1",
    ...extras,
  },
});

const topWalletCategory: CategoryContentCard = {
  id: "alwayson",
  type: ContentCardsType.category,
  location: ContentCardLocation.TopWallet,
  cardsType: ContentCardsType.action,
  cardsLayout: ContentCardsLayout.unique,
  isDismissable: true,
  createdAt: 0,
  viewed: false,
};

const expectedTrackingBase = {
  type: ContentCardsType.action,
  title: "Promo title",
  description: "Promo body",
  link: "https://example.com",
  order: 1,
  page: ContentCardLocation.TopWallet,
  location: ContentCardLocation.TopWallet,
  campaign: "card-1",
  contentcard: "Promo title",
  layout: ContentCardsLayout.unique,
  displayedPosition: 0,
};

describe("ContentCardsCategory Layout", () => {
  let canOpenURLSpy: jest.SpyInstance;
  let openURLSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseDynamicContent.mockImplementation(
      () =>
        ({
          trackContentCardEvent,
          logClickCard,
          dismissCard,
        }) as unknown as ReturnType<typeof useDynamicContent>,
    );
    mockUseWalletFeaturesConfig.mockReturnValue({
      shouldDisplayBrazePlacement: false,
    } as WalletFeaturesConfig);
    canOpenURLSpy = jest.spyOn(Linking, "canOpenURL").mockResolvedValue(true);
    openURLSpy = jest.spyOn(Linking, "openURL").mockResolvedValue(undefined);
  });

  afterEach(() => {
    canOpenURLSpy.mockRestore();
    openURLSpy.mockRestore();
  });

  it("should track category location on card click", async () => {
    const { user } = render(
      <Layout category={topWalletCategory} cards={[createBrazeActionCard()]} />,
    );

    await user.press(screen.getByTestId("card-click"));

    expect(trackContentCardEvent).toHaveBeenCalledWith(
      ContentCardEvent.Clicked,
      expectedTrackingBase,
    );
    expect(logClickCard).toHaveBeenCalledWith("card-1");
    expect(openURLSpy).toHaveBeenCalledWith("https://example.com");
  });

  it("should track category location on card dismiss", async () => {
    const { user } = render(
      <Layout category={topWalletCategory} cards={[createBrazeActionCard()]} />,
    );

    await user.press(screen.getByTestId("card-dismiss"));

    expect(trackContentCardEvent).toHaveBeenCalledWith(
      ContentCardEvent.Dismissed,
      expectedTrackingBase,
    );
    expect(dismissCard).toHaveBeenCalledWith("card-1");
  });
});
