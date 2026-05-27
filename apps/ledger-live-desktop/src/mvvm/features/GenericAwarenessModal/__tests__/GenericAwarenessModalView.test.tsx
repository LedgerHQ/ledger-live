import React from "react";
import { render, screen, waitFor } from "tests/testSetup";
import GenericAwarenessModalView from "../GenericAwarenessModalView";
import { carouselCampaignCard } from "./fixtures";

jest.mock("../hooks/useGenericAwarenessModalCarouselViewModel", () => ({
  __esModule: true,
  default: jest.fn(() => ({
    slides: [],
    onSlidePrimaryClick: jest.fn(),
  })),
}));

jest.mock("../hooks/useGenericAwarenessModalFeatureIntroViewModel", () => ({
  __esModule: true,
  default: jest.fn(() => ({
    title: "",
    subtitle: "",
    items: [],
    primaryButtonLabel: "",
    secondaryButtonLabel: "",
    onPrimaryClick: jest.fn(),
    onSecondaryClick: jest.fn(),
  })),
}));

describe("GenericAwarenessModalView", () => {
  it("should call onClose when open without a content card while stored cards exist", async () => {
    const onClose = jest.fn();

    render(<GenericAwarenessModalView isOpen onClose={onClose} contentCard={undefined} />, {
      initialState: {
        genericAwarenessModal: {
          contentCards: [carouselCampaignCard],
          campaignId: undefined,
        },
      },
    });

    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
    expect(screen.queryByTestId("generic-awareness-modal")).not.toBeInTheDocument();
  });

  it("should not call onClose when open without a content card before stored cards are loaded", () => {
    const onClose = jest.fn();

    render(<GenericAwarenessModalView isOpen onClose={onClose} contentCard={undefined} />);

    expect(onClose).not.toHaveBeenCalled();
  });

  it("should not call onClose when closed without a content card", () => {
    const onClose = jest.fn();

    render(
      <GenericAwarenessModalView isOpen={false} onClose={onClose} contentCard={undefined} />,
    );

    expect(onClose).not.toHaveBeenCalled();
  });

  it("should render the modal when open with a content card", () => {
    const onClose = jest.fn();

    render(
      <GenericAwarenessModalView
        isOpen
        onClose={onClose}
        contentCard={carouselCampaignCard}
      />,
    );

    expect(screen.getByTestId("generic-awareness-modal")).toBeVisible();
    expect(onClose).not.toHaveBeenCalled();
  });
});
