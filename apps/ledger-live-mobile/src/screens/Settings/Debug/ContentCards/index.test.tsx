import React from "react";
import { Linking } from "react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { GenericAwarenessModalLayout } from "@ledgerhq/live-common/genericAwarenessModal";
import { render, screen } from "@tests/test-renderer";
import { SafeAreaProvider } from "react-native-safe-area-context";
import type { State } from "~/reducers/types";
import {
  ContentCardLocation,
  ContentCardsLayout,
  ContentCardsType,
  LandingPageUseCase,
} from "~/dynamicContent/types";
import DebugContentCards from ".";
import { ALL_BUILDER_PRESETS, CARDS_PER_PLACEMENT_SEED } from "./Builder";

const Stack = createNativeStackNavigator();

function DebugContentCardsTestScreen() {
  return (
    <SafeAreaProvider
      initialMetrics={{
        frame: { x: 0, y: 0, width: 375, height: 812 },
        insets: { top: 0, left: 0, right: 0, bottom: 0 },
      }}
    >
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="DebugContentCards" component={DebugContentCards} />
      </Stack.Navigator>
    </SafeAreaProvider>
  );
}

const withExistingBrazeCard = (state: State): State => ({
  ...state,
  genericAwarenessModal: {
    ...state.genericAwarenessModal,
    contentCards: [
      {
        id: "braze-card",
        layout: GenericAwarenessModalLayout.Carousel,
        data: [],
        isReady: true,
      },
    ],
  },
});

const withDismissedGenericAwarenessModalCard = (state: State): State => ({
  ...withExistingBrazeCard(state),
  settings: {
    ...state.settings,
    dismissedContentCards: { "braze-card": Date.now() },
  },
});

const withLocalAndBrazeGenericAwarenessModal = (state: State): State => ({
  ...state,
  genericAwarenessModal: {
    ...state.genericAwarenessModal,
    contentCards: [
      {
        id: "braze-card",
        layout: GenericAwarenessModalLayout.Carousel,
        data: [],
        isReady: true,
      },
      {
        id: "local-card",
        layout: GenericAwarenessModalLayout.Prompt,
        title: "Local prompt",
        subtitle: "Local debug prompt",
        imageUrlLight: "",
        imageUrlDark: "",
        primaryButtonLabel: "Open",
        primaryButtonLink: "ledgerlive://portfolio",
        secondaryButtonLabel: "Later",
        secondaryButtonLink: "ledgerlive://myledger",
        isLocal: true,
      },
    ],
  },
});

const withInspectCards = (state: State): State => ({
  ...state,
  dynamicContent: {
    ...state.dynamicContent,
    mobileCards: [
      {
        id: "wallet-card",
        created: 123,
        viewed: false,
        extras: {
          platform: "mobile",
          location: "wallet",
          type: "hero",
          title: "Wallet card",
        },
      },
      {
        id: "crm-orphan-card",
        created: 123,
        viewed: false,
        extras: {
          platform: "mobile",
          location: "crm_typo_location",
          type: "hero",
          title: "Misconfigured CRM campaign",
        },
      },
    ] as unknown as State["dynamicContent"]["mobileCards"],
  },
  settings: {
    ...state.settings,
    dismissedContentCards: { "dismissed-card-99": Date.now() },
  },
});

const withLocalLandingPageCategory = (state: State): State => ({
  ...state,
  dynamicContent: {
    ...state.dynamicContent,
    localCategoriesCards: [
      {
        id: "debug-local-category-landing-page-1-category-debug-local-content-card-landing-page-1",
        categoryId: "debug-local-category-landing-page-1",
        location: LandingPageUseCase.LP_Buy,
        createdAt: 1,
        viewed: false,
        order: 0,
        cardsLayout: ContentCardsLayout.unique,
        cardsType: ContentCardsType.hero,
        type: ContentCardsType.category,
        title: "Stake and Earn category",
        description: "",
        cta: "",
        link: "",
        isDismissable: true,
        extras: {},
      },
    ] as unknown as State["dynamicContent"]["localCategoriesCards"],
    localMobileCards: [
      {
        id: "debug-local-content-card-landing-page-1",
        created: 1,
        viewed: false,
        extras: {
          platform: "mobile",
          categoryId: "debug-local-category-landing-page-1",
          title: "Stake and Earn",
        },
      },
    ] as unknown as State["dynamicContent"]["localMobileCards"],
  },
});

const lastText = (text: string | RegExp) => screen.getAllByText(text).at(-1)!;

describe("DebugContentCards", () => {
  it("should expose only Overview and Inspect as top-level tabs", () => {
    render(<DebugContentCardsTestScreen />);

    expect(screen.getAllByText("Overview").length).toBeGreaterThan(0);
    expect(screen.getByText("Inspect")).toBeOnTheScreen();
    expect(screen.queryByText("Builder")).not.toBeOnTheScreen();
    expect(screen.queryByText("Cards")).not.toBeOnTheScreen();
    expect(screen.queryByText("Local cards")).not.toBeOnTheScreen();
  });

  it("should create fixed-placement cards from Overview and keep them scoped to their placement", async () => {
    const { store, user } = render(<DebugContentCardsTestScreen />);

    await user.press(screen.getByText("Top wallet"));
    expect(screen.getByText("Card Category (alwayson)")).toBeOnTheScreen();
    expect(screen.getByText("0 child card(s)")).toBeOnTheScreen();

    await user.press(screen.getByTestId("debug-content-cards-placement-top_wallet"));
    await user.press(lastText("Create a local card"));
    expect(screen.getByText("Build a Top wallet card")).toBeOnTheScreen();
    expect(
      screen.getByText("Also creates its required category shell automatically."),
    ).toBeOnTheScreen();
    await user.press(screen.getByText("Create card"));

    const topWalletCategory = store.getState().dynamicContent.localCategoriesCards.at(-1);
    expect(topWalletCategory?.location).toBe(ContentCardLocation.TopWallet);
    expect(screen.getByText("Portfolio banner")).toBeOnTheScreen();
    expect(screen.getByText("Local")).toBeOnTheScreen();

    await user.press(screen.getByText("Wallet"));
    expect(screen.queryByText("Portfolio banner")).not.toBeOnTheScreen();
  });

  it("should keep representative builder controls constrained to valid placement options", async () => {
    const { store, user } = render(<DebugContentCardsTestScreen />);

    await user.press(screen.getByText("Wallet"));
    await user.press(lastText("Create a local card"));
    expect(screen.queryByText("Background color")).not.toBeOnTheScreen();
    expect(screen.getByText("Discover")).toBeOnTheScreen();
    await user.type(screen.getByDisplayValue(""), "bitcoin");
    expect(screen.queryByText("Discover")).not.toBeOnTheScreen();
    await user.press(screen.getByText("Create card"));
    expect(store.getState().dynamicContent.localWalletCards.at(-1)?.extras?.picto).toBe("bitcoin");

    await user.press(screen.getByText("Asset"));
    await user.press(lastText("Create a local card"));
    await user.press(screen.getByText("Yes, every asset"));
    await user.press(screen.getByText("Create card"));
    expect(
      store.getState().dynamicContent.localMobileCards.at(-1)?.extras.displayOnEveryAssets,
    ).toBe("true");
  });

  it("should let Top wallet action cards favor an image background over the icon variant", async () => {
    const { store, user } = render(<DebugContentCardsTestScreen />);

    await user.press(screen.getByText("Top wallet"));
    await user.press(lastText("Create a local card"));
    await user.press(screen.getByText("Portfolio action carousel"));
    expect(screen.getByText("Action visual")).toBeOnTheScreen();
    expect(screen.getByText("Gift")).toBeOnTheScreen();

    await user.press(screen.getByText("Image background"));
    expect(screen.queryByText("Gift")).not.toBeOnTheScreen();

    await user.press(screen.getByText("Create card"));
    expect(
      store.getState().dynamicContent.localMobileCards.at(-1)?.extras.image_background,
    ).toMatch(/^https:\/\/ledger-wp-website-s3-prd\.ledger\.com\//);
  });

  it("should handle landing-page category creation, counts, and deeplinks from the dedicated Overview entry", async () => {
    const openURLSpy = jest.spyOn(Linking, "openURL").mockResolvedValue(true);
    const { store, user } = render(<DebugContentCardsTestScreen />);

    await user.press(screen.getByText("Inspect a landing page"));
    expect(screen.queryByText("Open expected screen")).not.toBeOnTheScreen();
    expect(screen.getByText("Buy (0)")).toBeOnTheScreen();

    await user.press(screen.getByText("Buy (0)"));
    await user.press(screen.getByText("Create a local card for this landing page"));
    expect(screen.getByText("Build a Landing page category card")).toBeOnTheScreen();
    expect(screen.queryByText("Format")).not.toBeOnTheScreen();
    await user.press(screen.getByText("Create card"));

    const category = store.getState().dynamicContent.localCategoriesCards.at(-1);
    expect(category?.location).toBe(LandingPageUseCase.LP_Buy);
    expect(screen.getByText("Buy (1)")).toBeOnTheScreen();
    expect(
      screen.getByText(/^Card Category \(debug-local-category-landing-page-\d+\)$/),
    ).toBeOnTheScreen();
    expect(screen.queryByText("Other categories")).not.toBeOnTheScreen();

    await user.press(lastText("Open expected screen"));
    expect(openURLSpy).toHaveBeenCalledWith(
      `ledgerlive://landing-page?useCase=${LandingPageUseCase.LP_Buy}`,
    );

    openURLSpy.mockRestore();
  });

  it("should surface pre-existing landing-page categories only through the dedicated picker", async () => {
    const { user } = render(<DebugContentCardsTestScreen />, {
      overrideInitialState: withLocalLandingPageCategory,
    });

    expect(screen.queryByText("Other categories")).not.toBeOnTheScreen();
    await user.press(screen.getByText("Inspect a landing page"));
    expect(screen.getByText("Active landing pages")).toBeOnTheScreen();
    expect(screen.getByText("Empty landing pages")).toBeOnTheScreen();

    await user.press(screen.getByText("Buy (1)"));
    expect(
      screen.getByText("Card Category (debug-local-category-landing-page-1)"),
    ).toBeOnTheScreen();
    expect(screen.getByText("Stake and Earn")).toBeOnTheScreen();
    expect(screen.getByText("Local")).toBeOnTheScreen();
  });

  it("should seed and clear every local card from Inspect bulk actions", async () => {
    const { store, user } = render(<DebugContentCardsTestScreen />, {
      overrideInitialState: withLocalAndBrazeGenericAwarenessModal,
    });

    await user.press(screen.getByText("Inspect"));
    await user.press(
      screen.getByText(`Seed (${ALL_BUILDER_PRESETS.length * CARDS_PER_PLACEMENT_SEED})`),
    );

    const { dynamicContent: afterSeed, toasts: toastsAfterSeed } = store.getState();
    expect(afterSeed.localMobileCards.length + afterSeed.localWalletCards.length).toBe(
      ALL_BUILDER_PRESETS.length * CARDS_PER_PLACEMENT_SEED,
    );
    expect(afterSeed.localCategoriesCards).toHaveLength(3);
    expect(toastsAfterSeed.toasts.at(-1)?.title).toBe(
      `Seeded ${ALL_BUILDER_PRESETS.length * CARDS_PER_PLACEMENT_SEED} local cards`,
    );

    await user.press(screen.getByText("Clear"));

    const {
      dynamicContent: afterClear,
      genericAwarenessModal: afterClearGenericAwarenessModal,
      toasts: toastsAfterClear,
    } = store.getState();
    expect(afterClear.localMobileCards).toHaveLength(0);
    expect(afterClear.localWalletCards).toHaveLength(0);
    expect(afterClear.localCategoriesCards).toHaveLength(0);
    expect(afterClearGenericAwarenessModal.contentCards).toHaveLength(1);
    expect(afterClearGenericAwarenessModal.contentCards[0].id).toBe("braze-card");
    expect(toastsAfterClear.toasts.at(-1)?.title).toBe("Cleared all local cards");
  });

  it("should show fetched, dismissed, orphan, and feature-flag diagnostics in Inspect", async () => {
    const { user } = render(<DebugContentCardsTestScreen />, {
      overrideInitialState: withInspectCards,
    });

    expect(screen.queryByText("lwmWallet40")).not.toBeOnTheScreen();

    await user.press(screen.getByText("Inspect"));
    expect(screen.getByText("lwmWallet40")).toBeOnTheScreen();
    expect(screen.getByText("lwmGenericAwarenessModal")).toBeOnTheScreen();

    await user.press(screen.getByText("All cards"));
    expect(screen.getByText("Wallet card")).toBeOnTheScreen();

    await user.press(screen.getByText("Dismissed cards"));
    expect(screen.getByText("dismissed-card-99")).toBeOnTheScreen();

    await user.press(screen.getByText("Orphan cards"));
    expect(screen.getByText("Misconfigured CRM campaign")).toBeOnTheScreen();
    expect(screen.getByText(/location: crm_typo_location/)).toBeOnTheScreen();
    expect(screen.getByText(/typo in Braze/)).toBeOnTheScreen();
  });

  it("should create generic awareness modal cards without replacing existing campaigns", async () => {
    const { store, user } = render(<DebugContentCardsTestScreen />, {
      overrideInitialState: withExistingBrazeCard,
    });

    await user.press(screen.getByText("Generic awareness modal"));
    await user.press(screen.getByText("Carousel"));
    await user.press(screen.getByText("Create generic awareness modal"));

    const stateAfterCreate = store.getState();
    expect(stateAfterCreate.genericAwarenessModal.contentCards).toHaveLength(2);
    expect(stateAfterCreate.genericAwarenessModal.contentCards[0].id).toBe("braze-card");
    expect(stateAfterCreate.genericAwarenessModal.contentCards[1].id).toBe(
      "app_start_debug_generic_awareness_carousel",
    );
    expect(screen.getAllByText("Carousel").length).toBeGreaterThan(0);
    expect(screen.getByText("Local")).toBeOnTheScreen();
  });

  it("should show seen generic awareness modal cards as dismissed in Overview", async () => {
    const { user } = render(<DebugContentCardsTestScreen />, {
      overrideInitialState: withDismissedGenericAwarenessModalCard,
    });

    await user.press(screen.getByText("Generic awareness modal"));

    expect(screen.getByText("Why it's blocked")).toBeOnTheScreen();
    expect(screen.getByText(/dismissed card id: braze-card/)).toBeOnTheScreen();
  });

  it("should open expected placement deeplinks from card details", async () => {
    const openURLSpy = jest.spyOn(Linking, "openURL").mockResolvedValue(true);
    const { user } = render(<DebugContentCardsTestScreen />);

    await user.press(screen.getByText("Top wallet"));
    await user.press(lastText("Create a local card"));
    await user.press(screen.getByText("Create card"));
    await user.press(screen.getByText("Portfolio banner"));
    await user.press(lastText("Open expected screen"));

    expect(openURLSpy).toHaveBeenCalledWith("ledgerlive://portfolio");
    openURLSpy.mockRestore();
  });

  it("should close nested builder sheets without falling back to the parent placement sheet", async () => {
    const { user } = render(<DebugContentCardsTestScreen />);

    await user.press(screen.getByText("Top wallet"));
    await user.press(lastText("Create a local card"));
    expect(screen.getByText("Build a Top wallet card")).toBeOnTheScreen();

    const closeButtons = screen.getAllByTestId("bottom-sheet-header-close-button");
    await user.press(closeButtons[closeButtons.length - 1]);

    expect(screen.queryByText("Build a Top wallet card")).not.toBeOnTheScreen();
    expect(screen.queryByText("Create a local card")).not.toBeOnTheScreen();
    expect(screen.queryByText("Card Category (alwayson)")).not.toBeOnTheScreen();
  });

  it("should let QA create My Ledger as a promoted category-driven placement", async () => {
    const { store, user } = render(<DebugContentCardsTestScreen />);

    await user.press(screen.getByText("My Ledger"));
    await user.press(lastText("Create a local card"));
    expect(screen.getByText("Build a My Ledger card")).toBeOnTheScreen();
    await user.press(screen.getByText("Action"));
    await user.press(screen.getByText("Carousel"));
    await user.press(screen.getByText("Create card"));

    const category = store.getState().dynamicContent.localCategoriesCards.at(-1);
    expect(category?.location).toBe(ContentCardLocation.MyLedger);
    expect(category?.cardsType).toBe(ContentCardsType.action);
    expect(category?.cardsLayout).toBe(ContentCardsLayout.carousel);
    expect(screen.queryByText("Other categories")).not.toBeOnTheScreen();
  });
});
