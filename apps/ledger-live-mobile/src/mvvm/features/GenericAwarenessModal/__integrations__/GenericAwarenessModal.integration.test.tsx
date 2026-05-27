import React from "react";
import { Linking } from "react-native";
import { act, fireEvent, render, screen, waitFor } from "@tests/test-renderer";
import type { State } from "~/reducers/types";
import { carouselMockData, featureIntroMockData } from "../mockData";
import { GenericAwarenessModalDrawer } from "../screens/GenericAwarenessModalDrawer";

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
    appStartFeatureIntroMockData,
  ];
  const featureIntroContent = featureIntroMockData;
  const carouselSlides = carouselMockData.data;

  beforeEach(() => {
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

      await user.press(screen.getByText("Buy your Ledger device"));
      act(() => jest.runOnlyPendingTimers());
    });

    it("should close the modal when the main button is pressed", async () => {
      const { user } = render(<GenericAwarenessModalDrawer />, {
        overrideInitialState: withGenericAwarenessModal({
          isOpen: true,
          campaignId: featureIntroMockData.id,
        }),
      });
      act(() => jest.runOnlyPendingTimers());

      await user.press(screen.getByText("Connect"));
      act(() => jest.runOnlyPendingTimers());
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
      expect(screen.getAllByText("Continue")).not.toHaveLength(0);

      await user.press(screen.getAllByText("Continue")[0]);
      act(() => jest.runOnlyPendingTimers());
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

      await waitFor(() => {
        expect(screen.queryAllByText(carouselSlides[0].title)).toHaveLength(0);
      });
    });
  });
});
