import React from "react";
import { act, fireEvent, render, screen, waitFor } from "@tests/test-renderer";
import type { State } from "~/reducers/types";
import { carouselMockData, featureIntroMockData } from "../mockData";
import { GenericAwarenessModalDrawerView } from "../screens/GenericAwarenessModalDrawerView";

describe("GenericAwarenessModalDrawerView", () => {
  if (featureIntroMockData.layout !== "featureIntro") {
    throw new Error("Expected feature intro mock data");
  }
  if (carouselMockData.layout !== "carousel") {
    throw new Error("Expected carousel mock data");
  }

  const featureIntroContent = featureIntroMockData.content;
  const carouselSlides = carouselMockData.content;

  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    act(() => jest.runOnlyPendingTimers());
    jest.useRealTimers();
  });

  const withGenericAwarenessModal =
    (genericAwarenessModal: State["genericAwarenessModal"]) =>
    (state: State): State => ({
      ...state,
      genericAwarenessModal,
    });

  describe("featureIntro layout", () => {
    it("should render content and support pressing an action", async () => {
      const { user } = render(<GenericAwarenessModalDrawerView />, {
        overrideInitialState: withGenericAwarenessModal({
          isOpen: true,
          campaignId: featureIntroMockData.id,
        }),
      });
      act(() => jest.runOnlyPendingTimers());

      expect(screen.getByText(featureIntroContent.title)).toBeOnTheScreen();
      expect(screen.getByText(featureIntroContent.description)).toBeOnTheScreen();
      expect(screen.getByText("Full ownership")).toBeOnTheScreen();
      expect(screen.getByText("Your private keys never leave the device.")).toBeOnTheScreen();

      await user.press(screen.getByText("Buy your Ledger device"));
      act(() => jest.runOnlyPendingTimers());
    });

    it("should close the modal when the main button is pressed", async () => {
      const { user } = render(<GenericAwarenessModalDrawerView />, {
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
      const { user } = render(<GenericAwarenessModalDrawerView />, {
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
      const { user } = render(<GenericAwarenessModalDrawerView />, {
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

    it("should close the modal when the close button is pressed", async () => {
      const { user } = render(<GenericAwarenessModalDrawerView />, {
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
