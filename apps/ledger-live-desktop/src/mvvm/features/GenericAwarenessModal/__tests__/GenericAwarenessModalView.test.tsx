import React from "react";
import { fireEvent, render, screen, waitFor } from "tests/testSetup";
import { track, trackPage } from "~/renderer/analytics/segment";
import { closeGenericAwarenessModalDialog } from "LLD/features/GenericAwarenessModal/genericAwarenessModalDialog";
import GenericAwarenessModalView from "../GenericAwarenessModalView";
import {
  PAGE_TRACKING_AWARENESS_MODAL_CAROUSEL,
  PAGE_TRACKING_AWARENESS_MODAL_FEATURE_INTRO,
  PAGE_TRACKING_AWARENESS_MODAL_PROMPT,
} from "../analytics/const";
import {
  APP_START_CAMPAIGN_ID,
  CAROUSEL_CAMPAIGN_ID,
  PROMPT_CAMPAIGN_ID,
  appStartFeatureIntroCard,
  carouselCampaignCard,
  promptCampaignCard,
} from "../testUtils/fixtures";
import {
  createGenericAwarenessModalTestState,
  renderOpenAwarenessModalView,
} from "../testUtils/modalTestUtils";

jest.mock("LLD/features/GenericAwarenessModal/genericAwarenessModalDialog", () => ({
  closeGenericAwarenessModalDialog: jest.fn(() => jest.fn()),
}));

describe("GenericAwarenessModalView", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("auto-close without content card", () => {
    it("should call onClose when open without a content card while stored cards exist", async () => {
      const onClose = jest.fn();

      render(<GenericAwarenessModalView isOpen onClose={onClose} contentCard={undefined} />, {
        initialState: createGenericAwarenessModalTestState({
          genericAwarenessModal: {
            contentCards: [carouselCampaignCard],
            campaignId: undefined,
          },
        }),
      });

      await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
      expect(screen.queryByTestId("generic-awareness-modal")).not.toBeInTheDocument();
    });

    it.each([
      ["before stored cards are loaded", { isOpen: true }],
      ["when closed", { isOpen: false }],
    ] as const)("should not call onClose %s", (_label, { isOpen }) => {
      const onClose = jest.fn();

      render(
        <GenericAwarenessModalView isOpen={isOpen} onClose={onClose} contentCard={undefined} />,
      );

      expect(onClose).not.toHaveBeenCalled();
    });
  });

  it("should render feature intro, track the page, and hide carousel controls", () => {
    renderOpenAwarenessModalView(appStartFeatureIntroCard);

    expect(screen.getByTestId("generic-awareness-modal")).toHaveAttribute(
      "data-campaign-id",
      APP_START_CAMPAIGN_ID,
    );
    expect(screen.getByText("Connect a Ledger device")).toBeVisible();
    expect(screen.queryByTestId("generic-awareness-modal-continue-button")).not.toBeInTheDocument();
    expect(trackPage).toHaveBeenCalledWith(
      PAGE_TRACKING_AWARENESS_MODAL_FEATURE_INTRO,
      undefined,
      expect.objectContaining({ contentId: APP_START_CAMPAIGN_ID }),
      true,
      false,
    );
  });

  it("should render carousel, track the initial step, and show carousel controls", () => {
    renderOpenAwarenessModalView(carouselCampaignCard);

    expect(screen.getByTestId("generic-awareness-modal")).toHaveAttribute(
      "data-campaign-id",
      CAROUSEL_CAMPAIGN_ID,
    );
    expect(screen.getByText("Ledger Flex")).toBeVisible();
    expect(screen.getByTestId("generic-awareness-modal-continue-button")).toBeVisible();
    expect(trackPage).toHaveBeenCalledWith(
      PAGE_TRACKING_AWARENESS_MODAL_CAROUSEL,
      undefined,
      expect.objectContaining({
        contentId: CAROUSEL_CAMPAIGN_ID,
        step: 1,
        stepName: "Ledger Flex",
        totalSteps: 4,
      }),
      true,
      false,
    );
  });

  it("should render prompt, track the page, and hide carousel controls", () => {
    renderOpenAwarenessModalView(promptCampaignCard);

    expect(screen.getByTestId("generic-awareness-modal")).toHaveAttribute(
      "data-campaign-id",
      PROMPT_CAMPAIGN_ID,
    );
    expect(screen.getByText("Stay in control")).toBeVisible();
    expect(screen.queryByTestId("generic-awareness-modal-continue-button")).not.toBeInTheDocument();
    expect(trackPage).toHaveBeenCalledWith(
      PAGE_TRACKING_AWARENESS_MODAL_PROMPT,
      undefined,
      expect.objectContaining({ contentId: PROMPT_CAMPAIGN_ID }),
      true,
      false,
    );
  });

  it("should track dismiss and close the dialog on escape", () => {
    renderOpenAwarenessModalView(carouselCampaignCard);

    fireEvent.keyDown(screen.getByTestId("generic-awareness-modal"), {
      key: "Escape",
      code: "Escape",
    });

    expect(track).toHaveBeenCalledWith(
      "drawer_dismissed",
      expect.objectContaining({
        contentId: CAROUSEL_CAMPAIGN_ID,
        stepName: "Ledger Flex",
      }),
    );
    expect(jest.mocked(closeGenericAwarenessModalDialog)).toHaveBeenCalled();
  });

  it("should track prompt dismiss and close the dialog on escape", () => {
    renderOpenAwarenessModalView(promptCampaignCard);

    fireEvent.keyDown(screen.getByTestId("generic-awareness-modal"), {
      key: "Escape",
      code: "Escape",
    });

    expect(track).toHaveBeenCalledWith(
      "drawer_dismissed",
      expect.objectContaining({ contentId: PROMPT_CAMPAIGN_ID }),
    );
    expect(jest.mocked(closeGenericAwarenessModalDialog)).toHaveBeenCalled();
  });
});
