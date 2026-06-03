import React from "react";
import { Linking } from "react-native";
import { act, fireEvent, render, screen, waitFor } from "@tests/test-renderer";
import { screen as analyticsScreen, track } from "~/analytics";
import type { State } from "~/reducers/types";
import { carouselMockData, featureIntroMockData, promptMockData } from "../mockData";
import { GenericAwarenessModalDrawer } from "../screens/GenericAwarenessModalDrawer";
import {
  GENERIC_AWARENESS_MODAL_CAROUSEL_PAGE,
  GENERIC_AWARENESS_MODAL_FEATURE_INTRO_PAGE,
  GENERIC_AWARENESS_MODAL_PROMPT_PAGE,
} from "../analytics";

describe("GenericAwarenessModalDrawer", () => {
  if (featureIntroMockData.layout !== "featureIntro") {
    throw new Error("Expected feature intro mock data");
  }
  if (carouselMockData.layout !== "carousel") {
    throw new Error("Expected carousel mock data");
  }

  const appStartFeatureIntroMockData = {
    ...featureIntroMockData,
    id: "app_start-feature-intro",
  };
  const genericAwarenessModalContentCards = [
    featureIntroMockData,
    carouselMockData,
    promptMockData,
    appStartFeatureIntroMockData,
  ];
  const featureIntroContent = featureIntroMockData;
  const carouselSlides = carouselMockData.data;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    act(() => jest.runOnlyPendingTimers());
    jest.useRealTimers();
  });

  const withGenericAwarenessModal =
    (genericAwarenessModal: Partial<State["genericAwarenessModal"]>) =>
    (state: State): State => ({
      ...state,
      genericAwarenessModal: {
        ...state.genericAwarenessModal,
        contentCards: genericAwarenessModalContentCards,
        ...genericAwarenessModal,
      },
    });

  it("should dismiss and remove the current app-start content card when closed", async () => {
    const { user, store } = render(<GenericAwarenessModalDrawer />, {
      overrideInitialState: withGenericAwarenessModal({
        isOpen: true,
        campaignId: appStartFeatureIntroMockData.id,
      }),
    });
    act(() => jest.runOnlyPendingTimers());

    expect(screen.getByText(featureIntroContent.title)).toBeOnTheScreen();

    const closeButton = screen.getByTestId("bottom-sheet-header-close-button");
    await user.press(closeButton);
    fireEvent(closeButton, "dismiss");
    act(() => jest.runOnlyPendingTimers());

    await waitFor(() => {
      expect(screen.queryByText(featureIntroContent.title)).toBeNull();
    });

    const state = store.getState();
    expect(state.genericAwarenessModal.isOpen).toBe(false);
    expect(state.genericAwarenessModal.contentCards).not.toContainEqual(
      appStartFeatureIntroMockData,
    );
    expect(state.settings.dismissedContentCards[appStartFeatureIntroMockData.id]).toEqual(
      expect.any(Number),
    );
  });

  it("should not dismiss and remove a campaign content card when closed", async () => {
    const { user, store } = render(<GenericAwarenessModalDrawer />, {
      overrideInitialState: withGenericAwarenessModal({
        isOpen: true,
        campaignId: featureIntroMockData.id,
      }),
    });
    act(() => jest.runOnlyPendingTimers());

    expect(screen.getByText(featureIntroContent.title)).toBeOnTheScreen();

    const closeButton = screen.getByTestId("bottom-sheet-header-close-button");
    await user.press(closeButton);
    fireEvent(closeButton, "dismiss");
    act(() => jest.runOnlyPendingTimers());

    await waitFor(() => {
      expect(screen.queryByText(featureIntroContent.title)).toBeNull();
    });

    const state = store.getState();
    expect(state.genericAwarenessModal.isOpen).toBe(false);
    expect(state.genericAwarenessModal.contentCards).toContainEqual(featureIntroMockData);
    expect(state.settings.dismissedContentCards[featureIntroMockData.id]).toBeUndefined();
  });

  describe("featureIntro layout", () => {
    it("should render content and support pressing an action", async () => {
      const { user } = render(<GenericAwarenessModalDrawer />, {
        overrideInitialState: withGenericAwarenessModal({
          isOpen: true,
          campaignId: featureIntroMockData.id,
        }),
      });
      act(() => jest.runOnlyPendingTimers());

      expect(screen.getByText(featureIntroContent.title)).toBeOnTheScreen();
      expect(screen.getByText(featureIntroContent.subtitle)).toBeOnTheScreen();
      expect(screen.getByText("Full ownership")).toBeOnTheScreen();
      expect(screen.getByText("Your private keys never leave the device.")).toBeOnTheScreen();
      expect(screen.getByText(featureIntroContent.title)).toHaveProp("numberOfLines", 2);
      expect(screen.getByText(featureIntroContent.subtitle)).toHaveProp("numberOfLines", 3);
      expect(screen.getByText("Full ownership")).toHaveProp("numberOfLines", 1);
      expect(screen.getByText("Your private keys never leave the device.")).toHaveProp(
        "numberOfLines",
        2,
      );
      expect(analyticsScreen).toHaveBeenCalledWith(
        GENERIC_AWARENESS_MODAL_FEATURE_INTRO_PAGE,
        undefined,
        {
          name: GENERIC_AWARENESS_MODAL_FEATURE_INTRO_PAGE,
          contentId: featureIntroMockData.id,
        },
      );

      await user.press(screen.getByText("Buy your Ledger device"));
      act(() => jest.runOnlyPendingTimers());

      expect(track).toHaveBeenCalledWith("button_clicked", {
        button: "Buy your Ledger device",
        page: GENERIC_AWARENESS_MODAL_FEATURE_INTRO_PAGE,
        contentId: featureIntroMockData.id,
        ctaPosition: "secondary",
        link: featureIntroContent.secondaryButtonLink,
      });
    });

    it("should close the modal and track the primary CTA when the main button is pressed", async () => {
      const { user } = render(<GenericAwarenessModalDrawer />, {
        overrideInitialState: withGenericAwarenessModal({
          isOpen: true,
          campaignId: featureIntroMockData.id,
        }),
      });
      act(() => jest.runOnlyPendingTimers());

      await user.press(screen.getByText("Connect"));
      act(() => jest.runOnlyPendingTimers());

      expect(track).toHaveBeenCalledWith("button_clicked", {
        button: "Connect",
        page: GENERIC_AWARENESS_MODAL_FEATURE_INTRO_PAGE,
        contentId: featureIntroMockData.id,
        ctaPosition: "primary",
        link: featureIntroContent.primaryButtonLink,
      });
      expect(track).toHaveBeenCalledWith("drawer_dismissed", {
        drawer: GENERIC_AWARENESS_MODAL_FEATURE_INTRO_PAGE,
        page: GENERIC_AWARENESS_MODAL_FEATURE_INTRO_PAGE,
        contentId: featureIntroMockData.id,
      });
    });

    it("should close the modal when the close button is pressed", async () => {
      const { user } = render(<GenericAwarenessModalDrawer />, {
        overrideInitialState: withGenericAwarenessModal({
          isOpen: true,
          campaignId: featureIntroMockData.id,
        }),
      });
      act(() => jest.runOnlyPendingTimers());

      expect(screen.getByText(featureIntroContent.title)).toBeOnTheScreen();
      const closeButton = screen.getByTestId("bottom-sheet-header-close-button");
      await user.press(closeButton);
      fireEvent(closeButton, "dismiss");
      act(() => jest.runOnlyPendingTimers());

      expect(track).toHaveBeenCalledWith("drawer_dismissed", {
        drawer: GENERIC_AWARENESS_MODAL_FEATURE_INTRO_PAGE,
        page: GENERIC_AWARENESS_MODAL_FEATURE_INTRO_PAGE,
        contentId: featureIntroMockData.id,
      });
    });
  });

  describe("carousel layout", () => {
    it("should render content and support pressing an action", async () => {
      const { user } = render(<GenericAwarenessModalDrawer />, {
        overrideInitialState: withGenericAwarenessModal({
          isOpen: true,
          campaignId: carouselMockData.id,
        }),
      });
      act(() => jest.runOnlyPendingTimers());
      fireEvent(screen.getByTestId("generic-awareness-modal-carousel-slides"), "layout", {
        nativeEvent: { layout: { width: 375, height: 800 } },
      });

      expect(await screen.findAllByText(carouselSlides[0].title)).not.toHaveLength(0);
      expect(screen.getAllByText(carouselSlides[0].subtitle)).not.toHaveLength(0);
      expect(screen.getAllByText(carouselSlides[0].title)[0]).toHaveProp("numberOfLines", 1);
      expect(screen.getAllByText(carouselSlides[0].subtitle)[0]).toHaveProp("numberOfLines", 3);
      expect(screen.getAllByText("Continue")).not.toHaveLength(0);
      expect(analyticsScreen).toHaveBeenCalledWith(
        GENERIC_AWARENESS_MODAL_CAROUSEL_PAGE,
        undefined,
        {
          name: GENERIC_AWARENESS_MODAL_CAROUSEL_PAGE,
          contentId: carouselMockData.id,
          step: 1,
          stepName: carouselSlides[0].title,
          totalSteps: carouselSlides.length,
        },
      );

      await user.press(screen.getAllByText("Continue")[0]);
      act(() => jest.runOnlyPendingTimers());

      expect(track).toHaveBeenCalledWith("button_clicked", {
        button: "Continue",
        page: GENERIC_AWARENESS_MODAL_CAROUSEL_PAGE,
        contentId: carouselMockData.id,
        ctaPosition: "primary",
        step: 1,
        stepName: carouselSlides[0].title,
        totalSteps: carouselSlides.length,
      });
    });

    it("should open the primary http link without closing the modal when the primary button is pressed", async () => {
      const primarySlide = carouselSlides[0];
      const openURLSpy = jest.spyOn(Linking, "openURL").mockResolvedValue(undefined);

      if (!primarySlide.primaryButtonLabel || !primarySlide.primaryButtonLink) {
        throw new Error("Expected first carousel slide to have a primary button");
      }

      const { user } = render(<GenericAwarenessModalDrawer />, {
        overrideInitialState: withGenericAwarenessModal({
          isOpen: true,
          campaignId: carouselMockData.id,
        }),
      });
      act(() => jest.runOnlyPendingTimers());
      const genericAwarenessModalSlides = screen.getByTestId(
        "generic-awareness-modal-carousel-slides",
      );
      fireEvent(genericAwarenessModalSlides, "layout", {
        nativeEvent: { layout: { width: 375, height: 800 } },
      });

      await user.press(screen.getAllByText(primarySlide.primaryButtonLabel)[0]);

      await waitFor(() => {
        expect(openURLSpy).toHaveBeenCalledWith(primarySlide.primaryButtonLink);
      });
      expect(track).toHaveBeenCalledWith("button_clicked", {
        button: primarySlide.primaryButtonLabel,
        page: GENERIC_AWARENESS_MODAL_CAROUSEL_PAGE,
        contentId: carouselMockData.id,
        ctaPosition: "secondary",
        link: primarySlide.primaryButtonLink,
        step: 1,
        stepName: carouselSlides[0].title,
        totalSteps: carouselSlides.length,
      });
      act(() => jest.runOnlyPendingTimers());

      expect(genericAwarenessModalSlides).toBeOnTheScreen();
      openURLSpy.mockRestore();
    });

    it("should only expose the focused slide primary button label", async () => {
      const firstSlide = carouselSlides[0];
      const secondSlide = carouselSlides[1];

      if (
        !firstSlide.primaryButtonLabel ||
        !secondSlide.primaryButtonLabel ||
        firstSlide.primaryButtonLabel === secondSlide.primaryButtonLabel
      ) {
        throw new Error("Expected first two carousel slides to have different primary labels");
      }

      render(<GenericAwarenessModalDrawer />, {
        overrideInitialState: withGenericAwarenessModal({
          isOpen: true,
          campaignId: carouselMockData.id,
        }),
      });
      act(() => jest.runOnlyPendingTimers());
      fireEvent(screen.getByTestId("generic-awareness-modal-carousel-slides"), "layout", {
        nativeEvent: { layout: { width: 375, height: 800 } },
      });

      await screen.findAllByText(firstSlide.title);

      expect(screen.queryAllByText(firstSlide.primaryButtonLabel)).toHaveLength(1);
      expect(screen.queryAllByText(secondSlide.primaryButtonLabel)).toHaveLength(0);
    });

    it("should close the modal when the close button is pressed", async () => {
      const { user } = render(<GenericAwarenessModalDrawer />, {
        overrideInitialState: withGenericAwarenessModal({
          isOpen: true,
          campaignId: carouselMockData.id,
        }),
      });
      act(() => jest.runOnlyPendingTimers());
      fireEvent(screen.getByTestId("generic-awareness-modal-carousel-slides"), "layout", {
        nativeEvent: { layout: { width: 375, height: 800 } },
      });
      await screen.findAllByText(carouselSlides[0].title);

      const closeButton = screen.getByTestId("bottom-sheet-header-close-button");
      await user.press(closeButton);
      fireEvent(closeButton, "dismiss");
      act(() => jest.runOnlyPendingTimers());

      expect(track).toHaveBeenCalledWith("drawer_dismissed", {
        drawer: GENERIC_AWARENESS_MODAL_CAROUSEL_PAGE,
        page: GENERIC_AWARENESS_MODAL_CAROUSEL_PAGE,
        contentId: carouselMockData.id,
        step: 1,
        stepName: carouselSlides[0].title,
        totalSteps: carouselSlides.length,
      });

      await waitFor(() => {
        expect(screen.queryAllByText(carouselSlides[0].title)).toHaveLength(0);
      });
    });
  });

  describe("prompt layout", () => {
    it("should render prompt content and track interactions", async () => {
      const openURLSpy = jest.spyOn(Linking, "openURL").mockResolvedValue(undefined);
      const { user } = render(<GenericAwarenessModalDrawer />, {
        overrideInitialState: withGenericAwarenessModal({
          isOpen: true,
          campaignId: promptMockData.id,
        }),
      });
      act(() => jest.runOnlyPendingTimers());

      expect(await screen.findByText(promptMockData.title)).toBeOnTheScreen();
      expect(screen.getByText(promptMockData.subtitle)).toBeOnTheScreen();
      expect(screen.getByText("Close")).toBeOnTheScreen();
      expect(analyticsScreen).toHaveBeenCalledWith(GENERIC_AWARENESS_MODAL_PROMPT_PAGE, undefined, {
        name: GENERIC_AWARENESS_MODAL_PROMPT_PAGE,
        contentId: promptMockData.id,
      });

      await user.press(screen.getByText(promptMockData.primaryButtonLabel));

      await waitFor(() => {
        expect(openURLSpy).toHaveBeenCalledWith(promptMockData.primaryButtonLink);
      });
      expect(track).toHaveBeenCalledWith("button_clicked", {
        button: promptMockData.primaryButtonLabel,
        page: GENERIC_AWARENESS_MODAL_PROMPT_PAGE,
        contentId: promptMockData.id,
        ctaPosition: "secondary",
        link: promptMockData.primaryButtonLink,
      });

      await user.press(screen.getByText("Close"));
      act(() => jest.runOnlyPendingTimers());

      expect(track).toHaveBeenCalledWith("button_clicked", {
        button: "Close",
        page: GENERIC_AWARENESS_MODAL_PROMPT_PAGE,
        contentId: promptMockData.id,
        ctaPosition: "primary",
      });
      expect(track).toHaveBeenCalledWith("drawer_dismissed", {
        drawer: GENERIC_AWARENESS_MODAL_PROMPT_PAGE,
        page: GENERIC_AWARENESS_MODAL_PROMPT_PAGE,
        contentId: promptMockData.id,
      });
      openURLSpy.mockRestore();
    });
  });
});
