import React from "react";
import { Linking, View } from "react-native";
import type { ContentCard } from "@braze/react-native-sdk";
import { track } from "@shared/analytics";
import { ContentCardEvent } from "@ledgerhq/live-common/braze/contentCardExtras";
import { fireEvent, render, screen, waitFor } from "@tests/test-renderer";
import { InViewProvider } from "LLM/contexts/InViewContext";
import ContentCardsLocation from "~/dynamicContent/ContentCardsLocation";
import {
  ContentCardLocation,
  ContentCardsLayout,
  ContentCardsType,
  type CategoryContentCard,
} from "~/dynamicContent/types";

const CATEGORY_ID = "my-ledger-cat";
const CARD_ID = "child-1";
const TITLE = "Install apps";
const CATEGORY_STEP_THAT_MUST_NOT_LEAK = "Category step that must not leak";

const categoryExtras = {
  type: ContentCardsType.category,
  id: CATEGORY_ID,
  location: ContentCardLocation.MyLedger,
  canvas_name: "My Ledger canvas",
  canvas_step_name: CATEGORY_STEP_THAT_MUST_NOT_LEAK,
  cardsLayout: ContentCardsLayout.unique,
  cardsType: ContentCardsType.action,
};

const childExtras = {
  categoryId: CATEGORY_ID,
  type: ContentCardsType.action,
  title: TITLE,
  description: "Add Bitcoin",
  link: "ledgerlive://myledger",
  image: "https://example.com/apps.png",
  canvas_step_name: "Install step",
  location: ContentCardLocation.MyLedger,
};

const category: CategoryContentCard = {
  id: "cat-card",
  categoryId: CATEGORY_ID,
  location: ContentCardLocation.MyLedger,
  createdAt: 1_690_112_400,
  viewed: false,
  order: 1,
  cardsLayout: ContentCardsLayout.unique,
  cardsType: ContentCardsType.action,
  type: ContentCardsType.category,
  title: "My Ledger",
  isDismissable: true,
  extras: categoryExtras,
};

const categoryCard = {
  id: "cat-card",
  created: 1_690_112_400,
  expiresAt: -1,
  viewed: false,
  clicked: false,
  pinned: false,
  dismissed: false,
  dismissible: true,
  openURLInWebView: false,
  isControl: false,
  extras: categoryExtras,
  type: "Classic",
  title: "My Ledger",
  cardDescription: "",
} as ContentCard;

const childCard = {
  id: CARD_ID,
  created: 1_690_112_401,
  expiresAt: -1,
  viewed: false,
  clicked: false,
  pinned: false,
  dismissed: false,
  dismissible: true,
  openURLInWebView: false,
  isControl: false,
  extras: childExtras,
  type: "Classic",
  title: TITLE,
  cardDescription: childExtras.description,
} as ContentCard;

const trackedCard = {
  categoryId: CATEGORY_ID,
  type: ContentCardsType.action,
  title: TITLE,
  description: childExtras.description,
  link: childExtras.link,
  image: childExtras.image,
  page: ContentCardLocation.MyLedger,
  location: ContentCardLocation.MyLedger,
  canvas_name: categoryExtras.canvas_name,
  canvas_step_name: childExtras.canvas_step_name,
};

const interactionPayload = {
  ...trackedCard,
  campaign: CARD_ID,
  contentcard: TITLE,
  layout: ContentCardsLayout.unique,
  displayedPosition: 0,
};

const callsFor = (eventName: string) =>
  jest.mocked(track).mock.calls.filter(([event]) => event === eventName);

const renderMyLedger = () =>
  render(
    <InViewProvider intervalDuration={20}>
      <ContentCardsLocation locationId={ContentCardLocation.MyLedger} />
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
          categoriesCards: [category],
          mobileCards: [categoryCard, childCard],
        },
      }),
    },
  );

describe("My Ledger content cards", () => {
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

  it("should inherit canvas_name from the category and keep the child canvas_step_name on click", async () => {
    const { user } = renderMyLedger();

    expect(await screen.findByText(TITLE)).toBeOnTheScreen();
    await user.press(screen.getByText(TITLE));

    expect(callsFor(ContentCardEvent.Clicked)).toEqual([
      [ContentCardEvent.Clicked, interactionPayload],
    ]);
  });

  it("should inherit canvas_name from the category and keep the child canvas_step_name on dismiss", async () => {
    renderMyLedger();

    expect(await screen.findByText(TITLE)).toBeOnTheScreen();
    const close = screen.UNSAFE_getAllByType(View).find(view => {
      if (view.props.accessible !== true) return false;
      const hasIcon = view.findAll(node => String(node.type) === "RNSVGSvgView").length > 0;
      const hasTitle = view.findAll(node => node.props?.children === TITLE).length > 0;
      return hasIcon && !hasTitle;
    });
    fireEvent.press(close!);

    expect(callsFor(ContentCardEvent.Dismissed)).toEqual([
      [ContentCardEvent.Dismissed, interactionPayload],
    ]);
  });

  it("should track the inherited canvas payload when the My Ledger card is in view", async () => {
    renderMyLedger();

    expect(await screen.findByText(TITLE)).toBeOnTheScreen();

    const containerImpression = [
      "container_impression",
      { page: "", location: ContentCardLocation.MyLedger },
    ];

    await waitFor(() => {
      expect(callsFor(ContentCardEvent.Impression)).toEqual([
        [
          ContentCardEvent.Impression,
          {
            ...trackedCard,
            displayedPosition: 0,
          },
        ],
      ]);
      expect(callsFor("container_impression")).toEqual([containerImpression, containerImpression]);
    });
  });
});
