import React from "react";
import { Linking, TouchableOpacity, View } from "react-native";
import type { ContentCard } from "@braze/react-native-sdk";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { track } from "@shared/analytics";
import { ContentCardEvent } from "@ledgerhq/live-common/braze/contentCardExtras";
import { fireEvent, render, screen, waitFor } from "@tests/test-renderer";
import { InViewProvider } from "LLM/contexts/InViewContext";
import { ContentCardLocation, type AssetContentCard } from "~/dynamicContent/types";
import AssetDynamicContent from "./AssetDynamicContent";

const CARD_ID = "asset-1";
const CTA = "Buy Bitcoin";
const EXTRAS = {
  canvas_name: "Asset canvas",
  canvas_step_name: "Asset step",
  location: ContentCardLocation.Asset,
  assets: "bitcoin",
  title: "Stack sats",
  link: "ledgerlive://buy",
  cta: CTA,
  image: "https://example.com/btc.png",
};

const assetCard: AssetContentCard = {
  id: CARD_ID,
  title: EXTRAS.title,
  location: ContentCardLocation.Asset,
  image: EXTRAS.image,
  link: EXTRAS.link,
  cta: CTA,
  assets: "bitcoin",
  createdAt: 1_690_112_400,
  viewed: false,
  extras: EXTRAS,
};

const brazeCard = {
  id: CARD_ID,
  created: assetCard.createdAt,
  expiresAt: -1,
  viewed: false,
  clicked: false,
  pinned: false,
  dismissed: false,
  dismissible: true,
  openURLInWebView: false,
  isControl: false,
  extras: EXTRAS,
  type: "Classic",
  title: EXTRAS.title,
  cardDescription: "",
} as ContentCard;

const interactionPayload = {
  ...EXTRAS,
  screen: ContentCardLocation.Asset,
  campaign: CARD_ID,
};

const callsFor = (eventName: string) =>
  jest.mocked(track).mock.calls.filter(([event]) => event === eventName);

const renderAsset = () =>
  render(
    <InViewProvider intervalDuration={20}>
      <AssetDynamicContent currency={getCryptoCurrencyById("bitcoin")} />
    </InViewProvider>,
    {
      overrideInitialState: state => ({
        ...state,
        settings: {
          ...state.settings,
          analyticsEnabled: true,
          personalizedRecommendationsEnabled: true,
        },
        dynamicContent: {
          ...state.dynamicContent,
          isLoading: false,
          assetsCards: [assetCard],
          mobileCards: [brazeCard],
        },
      }),
    },
  );

describe("AssetDynamicContent", () => {
  beforeEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
    View.prototype.measureInWindow = callback => {
      callback(0, 0, 120, 120);
    };
    jest.spyOn(Linking, "openURL").mockResolvedValue(undefined as never);
    jest.spyOn(Linking, "canOpenURL").mockResolvedValue(true);
  });

  afterEach(() => {
    jest.useFakeTimers();
  });

  it("should render the asset card and track a click with the card payload", async () => {
    const { user } = renderAsset();

    expect(await screen.findByText(CTA)).toBeOnTheScreen();
    await user.press(screen.getByText(CTA));

    expect(callsFor(ContentCardEvent.Clicked)).toEqual([
      [ContentCardEvent.Clicked, interactionPayload],
    ]);
  });

  it("should track a dismiss with the card payload when the asset card is dismissed", async () => {
    renderAsset();

    expect(await screen.findByText(CTA)).toBeOnTheScreen();
    const buttons = screen.UNSAFE_getAllByType(TouchableOpacity);
    fireEvent.press(buttons[buttons.length - 1]);

    expect(callsFor(ContentCardEvent.Dismissed)).toEqual([
      [ContentCardEvent.Dismissed, interactionPayload],
    ]);
  });

  it("should track a card impression and a container impression when the asset card is in view", async () => {
    renderAsset();

    expect(await screen.findByText(CTA)).toBeOnTheScreen();

    await waitFor(() => {
      expect(callsFor(ContentCardEvent.Impression)).toEqual([
        [
          ContentCardEvent.Impression,
          {
            assets: EXTRAS.assets,
            title: EXTRAS.title,
            link: EXTRAS.link,
            cta: EXTRAS.cta,
            image: EXTRAS.image,
            page: ContentCardLocation.Asset,
            location: ContentCardLocation.Asset,
            canvas_name: EXTRAS.canvas_name,
            canvas_step_name: EXTRAS.canvas_step_name,
          },
        ],
      ]);
    });

    expect(callsFor("container_impression")).toEqual([
      ["container_impression", { page: "", location: ContentCardLocation.Asset }],
    ]);
  });
});
