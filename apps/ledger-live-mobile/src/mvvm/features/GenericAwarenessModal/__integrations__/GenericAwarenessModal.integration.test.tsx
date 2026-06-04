import React from "react";
import { Linking } from "react-native";
import { act, fireEvent, render, screen, waitFor, withFlagOverrides } from "@tests/test-renderer";
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

  const carouselContent = {
    ...carouselMockData,
    data: carouselMockData.data.map((slide, index) => ({
      ...slide,
      title: `Carousel slide ${index + 1}`,
      subtitle: `Carousel slide ${index + 1} subtitle`,
      primaryButtonLabel: slide.primaryButtonLabel
        ? `${slide.primaryButtonLabel} ${index + 1}`
        : slide.primaryButtonLabel,
    })),
  };
  const appStartFeatureIntroMockData = {
    ...featureIntroMockData,
    id: "app_start-feature-intro",
    title: "Discover what Ledger Wallet can do",
    subtitle: "Explore the app-start generic awareness modal.",
  };
  const genericAwarenessModalContentCards = [
    featureIntroMockData,
    carouselContent,
    promptMockData,
    appStartFeatureIntroMockData,
  ];
  const featureIntroContent = featureIntroMockData;
  const carouselSlides = carouselContent.data;

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

  const renderGenericAwarenessModal = (
    genericAwarenessModal: Partial<State["genericAwarenessModal"]> = {},
  ) =>
    render(<GenericAwarenessModalDrawer />, {
      overrideInitialState: withFlagOverrides(
        { lwmGenericAwarenessModal: { enabled: true } },
        withGenericAwarenessModal(genericAwarenessModal),
      ),
    });

  it("should dismiss and remove the current app-start content card when closed", async () => {
    const { user, store } = renderGenericAwarenessModal();
    act(() => jest.runOnlyPendingTimers());

    expect(await screen.findByText(appStartFeatureIntroMockData.title)).toBeOnTheScreen();

    const closeButton = screen.getByTestId("bottom-sheet-header-close-button");
    await user.press(closeButton);
    fireEvent(closeButton, "dismiss");
    act(() => jest.runOnlyPendingTimers());

    await waitFor(() => {
      expect(screen.queryByText(appStartFeatureIntroMockData.title)).not.toBeOnTheScreen();
    });
    expect(store.getState().settings.dismissedContentCards).toHaveProperty(
      appStartFeatureIntroMockData.id,
    );
  });

  it("should not dismiss and remove a campaign content card when closed", async () => {
    const { user } = renderGenericAwarenessModal({
      campaignId: featureIntroMockData.id,
    });
    act(() => jest.runOnlyPendingTimers());

    expect(await screen.findByText(featureIntroContent.title)).toBeOnTheScreen();

    const closeButton = screen.getByTestId("bottom-sheet-header-close-button");
    await user.press(closeButton);
    fireEvent(closeButton, "dismiss");
    act(() => jest.runOnlyPendingTimers());

    await waitFor(() => {
      expect(screen.queryByText(featureIntroContent.title)).not.toBeOnTheScreen();
    });
  });

  describe("featureIntro layout", () => {
    it("should render content and support pressing an action", async () => {
      const { user } = renderGenericAwarenessModal({
        campaignId: featureIntroMockData.id,
      });
      act(() => jest.runOnlyPendingTimers());

      expect(await screen.findByText(featureIntroContent.title)).toBeOnTheScreen();
      expect(screen.getByText(featureIntroContent.subtitle)).toBeOnTheScreen();
      expect(screen.getByText("Full ownership")).toBeOnTheScreen();
      expect(screen.getByText("Your private keys never leave the device.")).toBeOnTheScreen();
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
      const { user } = renderGenericAwarenessModal({
        campaignId: featureIntroMockData.id,
      });
      act(() => jest.runOnlyPendingTimers());

      await user.press(await screen.findByText("Connect"));
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
      const { user } = renderGenericAwarenessModal({
        campaignId: featureIntroMockData.id,
      });
      act(() => jest.runOnlyPendingTimers());

      expect(await screen.findByText(featureIntroContent.title)).toBeOnTheScreen();
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
      const { user } = renderGenericAwarenessModal({
        campaignId: carouselContent.id,
      });
      act(() => jest.runOnlyPendingTimers());
      fireEvent(await screen.findByTestId("generic-awareness-modal-carousel-slides"), "layout", {
        nativeEvent: { layout: { width: 375, height: 800 } },
      });

      expect(await screen.findByText(carouselSlides[0].title)).toBeOnTheScreen();
      expect(screen.getByText(carouselSlides[0].subtitle)).toBeOnTheScreen();
      expect(screen.getByText("Continue")).toBeOnTheScreen();
      expect(analyticsScreen).toHaveBeenCalledWith(
        GENERIC_AWARENESS_MODAL_CAROUSEL_PAGE,
        undefined,
        {
          name: GENERIC_AWARENESS_MODAL_CAROUSEL_PAGE,
          contentId: carouselContent.id,
          step: 1,
          stepName: carouselSlides[0].title,
          totalSteps: carouselSlides.length,
        },
      );

      const continueButton = screen.getByText("Continue");
      await user.press(continueButton);
      act(() => jest.runOnlyPendingTimers());

      expect(track).toHaveBeenCalledWith("button_clicked", {
        button: "Continue",
        page: GENERIC_AWARENESS_MODAL_CAROUSEL_PAGE,
        contentId: carouselContent.id,
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

      const { user } = renderGenericAwarenessModal({
        campaignId: carouselContent.id,
      });
      act(() => jest.runOnlyPendingTimers());
      const genericAwarenessModalSlides = await screen.findByTestId(
        "generic-awareness-modal-carousel-slides",
      );
      fireEvent(genericAwarenessModalSlides, "layout", {
        nativeEvent: { layout: { width: 375, height: 800 } },
      });

      await user.press(screen.getByText(primarySlide.primaryButtonLabel));

      await waitFor(() => {
        expect(openURLSpy).toHaveBeenCalledWith(primarySlide.primaryButtonLink);
      });
      expect(track).toHaveBeenCalledWith("button_clicked", {
        button: primarySlide.primaryButtonLabel,
        page: GENERIC_AWARENESS_MODAL_CAROUSEL_PAGE,
        contentId: carouselContent.id,
        ctaPosition: "secondary",
        link: primarySlide.primaryButtonLink,
        step: 1,
        stepName: carouselSlides[0].title,
        totalSteps: carouselSlides.length,
      });
      act(() => jest.runOnlyPendingTimers());

      expect(screen.getByText(primarySlide.title)).toBeOnTheScreen();
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

      renderGenericAwarenessModal({
        campaignId: carouselContent.id,
      });
      act(() => jest.runOnlyPendingTimers());
      fireEvent(await screen.findByTestId("generic-awareness-modal-carousel-slides"), "layout", {
        nativeEvent: { layout: { width: 375, height: 800 } },
      });

      expect(await screen.findByText(firstSlide.title)).toBeOnTheScreen();

      expect(screen.getByText(firstSlide.primaryButtonLabel)).toBeOnTheScreen();
      expect(screen.queryByText(secondSlide.primaryButtonLabel)).not.toBeOnTheScreen();
    });

    it("should close the modal when the close button is pressed", async () => {
      const { user } = renderGenericAwarenessModal({
        campaignId: carouselContent.id,
      });
      act(() => jest.runOnlyPendingTimers());
      fireEvent(await screen.findByTestId("generic-awareness-modal-carousel-slides"), "layout", {
        nativeEvent: { layout: { width: 375, height: 800 } },
      });
      expect(await screen.findByText(carouselSlides[0].title)).toBeOnTheScreen();

      const closeButton = screen.getByTestId("bottom-sheet-header-close-button");
      await user.press(closeButton);
      fireEvent(closeButton, "dismiss");
      act(() => jest.runOnlyPendingTimers());

      expect(track).toHaveBeenCalledWith("drawer_dismissed", {
        drawer: GENERIC_AWARENESS_MODAL_CAROUSEL_PAGE,
        page: GENERIC_AWARENESS_MODAL_CAROUSEL_PAGE,
        contentId: carouselContent.id,
        step: 1,
        stepName: carouselSlides[0].title,
        totalSteps: carouselSlides.length,
      });

      await waitFor(() => {
        expect(screen.queryByText(carouselSlides[0].title)).not.toBeOnTheScreen();
      });
    });
  });

  describe("prompt layout", () => {
    it("should render prompt content and track interactions", async () => {
      const openURLSpy = jest.spyOn(Linking, "openURL").mockResolvedValue(undefined);
      const { user } = renderGenericAwarenessModal({
        campaignId: promptMockData.id,
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
