import React from "react";
import { act, render, screen, waitFor } from "tests/testSetup";
import { track, trackPage } from "~/renderer/analytics/segment";
import { openURL } from "~/renderer/linking";
import GenericAwarenessModal from "..";
import {
  APP_START_CAMPAIGN_ID,
  CAROUSEL_CAMPAIGN_ID,
  FEATURE_INTRO_CAMPAIGN_ID,
  PROMPT_CAMPAIGN_ID,
} from "../testUtils/fixtures";
import {
  advanceCarouselSlide,
  advanceCarouselToLastSlide,
  dispatchGenericAwarenessModalThunk,
  getGenericAwarenessModalHeaderCloseButton,
  openGenericAwarenessModal,
  seedGenericAwarenessModalContentCards,
} from "../testUtils/modalTestUtils";
import {
  PAGE_TRACKING_AWARENESS_MODAL_CAROUSEL,
  PAGE_TRACKING_AWARENESS_MODAL_FEATURE_INTRO,
  PAGE_TRACKING_AWARENESS_MODAL_PROMPT,
} from "../analytics/const";
import {
  closeGenericAwarenessModalDialog,
  openGenericAwarenessModalDialog,
} from "../genericAwarenessModalDialog";

jest.mock("~/renderer/linking", () => ({
  openURL: jest.fn(),
}));

const renderModal = () =>
  render(<GenericAwarenessModal />, {
    initialState: {
      settings: {
        dismissedContentCards: {},
        hasCompletedOnboarding: true,
        overriddenFeatureFlags: {
          lwdGenericAwarenessModal: { enabled: true },
        },
      },
    },
  });

const openModal = (store: ReturnType<typeof renderModal>["store"], campaignId?: string) => {
  act(() => {
    seedGenericAwarenessModalContentCards(store);
    openGenericAwarenessModal(store, campaignId);
  });
};

describe("GenericAwarenessModal Integration", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should not render a dialog while the modal is closed", () => {
    renderModal();
    expect(screen.queryByTestId("generic-awareness-modal")).not.toBeInTheDocument();
  });

  describe("feature intro variant", () => {
    it("should open app-start feature intro, track page view, and close on Got it", async () => {
      const { store, user } = renderModal();
      openModal(store);

      await waitFor(() => {
        expect(screen.getByText("Connect a Ledger device")).toBeVisible();
      });
      expect(trackPage).toHaveBeenCalledWith(
        PAGE_TRACKING_AWARENESS_MODAL_FEATURE_INTRO,
        undefined,
        expect.objectContaining({ contentId: APP_START_CAMPAIGN_ID }),
        true,
        false,
      );

      await user.click(screen.getByRole("button", { name: "Got it" }));

      expect(track).toHaveBeenCalledWith(
        "button_clicked",
        expect.objectContaining({
          button: "got it",
          contentId: APP_START_CAMPAIGN_ID,
          ctaPosition: "primary",
          link: "https://www.ledger.com",
        }),
      );
      expect(openURL).toHaveBeenCalledWith("https://www.ledger.com");
      await waitFor(() => {
        expect(screen.queryByTestId("generic-awareness-modal")).not.toBeInTheDocument();
      });
      expect(store.getState().dialogs.GENERIC_AWARENESS_MODAL).toBe(false);
    });

    it("should open a deeplinked feature intro campaign", async () => {
      const { store } = renderModal();
      openModal(store, FEATURE_INTRO_CAMPAIGN_ID);

      await waitFor(() => {
        expect(screen.getByText("Not your keys, not your coins")).toBeVisible();
      });
      expect(screen.getByTestId("generic-awareness-modal")).toHaveAttribute(
        "data-campaign-id",
        FEATURE_INTRO_CAMPAIGN_ID,
      );
    });

    it("should track secondary click, open the link, and close the modal", async () => {
      const { store, user } = renderModal();
      openModal(store);

      await user.click(await screen.findByRole("button", { name: "Compare signers" }));

      expect(track).toHaveBeenCalledWith(
        "button_clicked",
        expect.objectContaining({
          button: "compare signers",
          contentId: APP_START_CAMPAIGN_ID,
          ctaPosition: "secondary",
          link: "https://www.ledger.com/compare-ledger-signers",
        }),
      );
      expect(openURL).toHaveBeenCalledWith("https://www.ledger.com/compare-ledger-signers");
      await waitFor(() => {
        expect(screen.queryByTestId("generic-awareness-modal")).not.toBeInTheDocument();
      });
    });

    it("should close when the header close button is clicked", async () => {
      const { store, user } = renderModal();
      openModal(store);

      await user.click(getGenericAwarenessModalHeaderCloseButton());

      expect(track).toHaveBeenCalledWith(
        "button_clicked",
        expect.objectContaining({ button: "close", contentId: APP_START_CAMPAIGN_ID }),
      );
      await waitFor(() => {
        expect(screen.queryByTestId("generic-awareness-modal")).not.toBeInTheDocument();
      });
      expect(store.getState().dialogs.GENERIC_AWARENESS_MODAL).toBe(false);
    });
  });

  describe("prompt variant", () => {
    it("should open prompt, track page view, and render actions", async () => {
      const { store } = renderModal();

      act(() => {
        seedGenericAwarenessModalContentCards(store);
        dispatchGenericAwarenessModalThunk(
          store,
          openGenericAwarenessModalDialog({ campaignId: PROMPT_CAMPAIGN_ID }),
        );
      });

      await waitFor(() => {
        expect(screen.getByText("Stay in control")).toBeVisible();
      });
      expect(
        screen.getByText("Move assets to a hardware signer for true self-custody."),
      ).toBeVisible();
      expect(screen.getByRole("button", { name: "Learn more" })).toBeVisible();
      expect(screen.getByRole("button", { name: "Maybe later" })).toBeVisible();
      expect(
        screen.queryByTestId("generic-awareness-modal-continue-button"),
      ).not.toBeInTheDocument();
      expect(screen.getByTestId("generic-awareness-modal").getAttribute("data-campaign-id")).toBe(
        PROMPT_CAMPAIGN_ID,
      );
      expect(trackPage).toHaveBeenCalledWith(
        PAGE_TRACKING_AWARENESS_MODAL_PROMPT,
        undefined,
        expect.objectContaining({ contentId: PROMPT_CAMPAIGN_ID }),
        true,
        false,
      );
    });

    it("should track primary click, open the link, and close the modal", async () => {
      const { store, user } = renderModal();

      act(() => {
        seedGenericAwarenessModalContentCards(store);
        dispatchGenericAwarenessModalThunk(
          store,
          openGenericAwarenessModalDialog({ campaignId: PROMPT_CAMPAIGN_ID }),
        );
      });

      await waitFor(() => {
        expect(screen.getByRole("button", { name: "Learn more" })).toBeVisible();
      });

      await user.click(screen.getByTestId("generic-awareness-modal-primary-button"));

      expect(track).toHaveBeenCalledWith(
        "button_clicked",
        expect.objectContaining({
          button: "learn more",
          contentId: PROMPT_CAMPAIGN_ID,
          ctaPosition: "primary",
          link: "https://www.ledger.com/academy",
        }),
      );
      expect(openURL).toHaveBeenCalledWith("https://www.ledger.com/academy");
      await waitFor(() => {
        expect(screen.queryByTestId("generic-awareness-modal")).not.toBeInTheDocument();
      });
      expect(store.getState().dialogs.GENERIC_AWARENESS_MODAL).toBe(false);
    });

    it("should track secondary click, open the link, and close the modal", async () => {
      const { store, user } = renderModal();
      openModal(store, PROMPT_CAMPAIGN_ID);

      await user.click(await screen.findByRole("button", { name: "Maybe later" }));

      expect(track).toHaveBeenCalledWith(
        "button_clicked",
        expect.objectContaining({
          button: "maybe later",
          contentId: PROMPT_CAMPAIGN_ID,
          ctaPosition: "secondary",
          link: "https://www.ledger.com",
        }),
      );
      expect(openURL).toHaveBeenCalledWith("https://www.ledger.com");
      await waitFor(() => {
        expect(screen.queryByTestId("generic-awareness-modal")).not.toBeInTheDocument();
      });
    });

    it("should close when the header close button is clicked", async () => {
      const { store, user } = renderModal();
      openModal(store, PROMPT_CAMPAIGN_ID);

      await user.click(getGenericAwarenessModalHeaderCloseButton());

      expect(track).toHaveBeenCalledWith(
        "button_clicked",
        expect.objectContaining({ button: "close", contentId: PROMPT_CAMPAIGN_ID }),
      );
      await waitFor(() => {
        expect(screen.queryByTestId("generic-awareness-modal")).not.toBeInTheDocument();
      });
      expect(store.getState().dialogs.GENERIC_AWARENESS_MODAL).toBe(false);
    });
  });

  describe("carousel variant", () => {
    it("should open carousel, track the initial step, and avoid feature intro copy", async () => {
      const { store } = renderModal();
      openModal(store, CAROUSEL_CAMPAIGN_ID);

      await waitFor(() => {
        expect(screen.getByText("Ledger Flex")).toBeVisible();
      });
      expect(screen.getByTestId("generic-awareness-modal-continue-button")).toBeVisible();
      expect(screen.queryByText("Connect a Ledger device")).not.toBeInTheDocument();
      expect(trackPage).toHaveBeenCalledWith(
        PAGE_TRACKING_AWARENESS_MODAL_CAROUSEL,
        undefined,
        expect.objectContaining({
          contentId: CAROUSEL_CAMPAIGN_ID,
          step: 1,
          stepName: "Ledger Flex",
        }),
        true,
        false,
      );
    });

    it("should close carousel without flashing feature intro content", async () => {
      const { store } = renderModal();
      openModal(store, CAROUSEL_CAMPAIGN_ID);

      await waitFor(() => {
        expect(screen.getByText("Ledger Flex")).toBeVisible();
      });

      act(() => {
        dispatchGenericAwarenessModalThunk(store, closeGenericAwarenessModalDialog());
      });

      expect(screen.queryByText("Connect a Ledger device")).not.toBeInTheDocument();
      await waitFor(() => {
        expect(screen.queryByTestId("generic-awareness-modal")).not.toBeInTheDocument();
      });
    });

    it("should track continue navigation when advancing slides", async () => {
      const { store, user } = renderModal();
      openModal(store, CAROUSEL_CAMPAIGN_ID);

      await waitFor(() => {
        expect(screen.getByText("Ledger Flex")).toBeVisible();
      });

      jest.mocked(track).mockClear();
      jest.mocked(trackPage).mockClear();

      await advanceCarouselSlide(user, "Ledger Flex");

      expect(track).toHaveBeenCalledWith(
        "button_clicked",
        expect.objectContaining({
          button: "continue",
          contentId: CAROUSEL_CAMPAIGN_ID,
          stepName: "Ledger Flex",
        }),
      );
      expect(trackPage).toHaveBeenCalledWith(
        PAGE_TRACKING_AWARENESS_MODAL_CAROUSEL,
        undefined,
        expect.objectContaining({
          contentId: CAROUSEL_CAMPAIGN_ID,
          step: 2,
          stepName: "Ledger Wallet clarity",
        }),
        true,
        false,
      );
      await waitFor(() => {
        expect(screen.getByText("Ledger Wallet clarity")).toBeVisible();
      });
    });

    it("should complete the tour and close on the last slide", async () => {
      const { store, user } = renderModal();
      openModal(store, CAROUSEL_CAMPAIGN_ID);

      await waitFor(() => {
        expect(screen.getByText("Ledger Flex")).toBeVisible();
      });

      await advanceCarouselToLastSlide(user);
      await user.click(screen.getByRole("button", { name: "Close" }));

      expect(track).toHaveBeenCalledWith(
        "tour_completed",
        expect.objectContaining({
          contentId: CAROUSEL_CAMPAIGN_ID,
          stepName: "Ethereum & beyond",
        }),
      );
      await waitFor(() => {
        expect(screen.queryByTestId("generic-awareness-modal")).not.toBeInTheDocument();
      });
      expect(store.getState().dialogs.GENERIC_AWARENESS_MODAL).toBe(false);
    });

    it("should close when the carousel primary button is clicked", async () => {
      const { store, user } = renderModal();
      openModal(store, CAROUSEL_CAMPAIGN_ID);

      await user.click(await screen.findByTestId("generic-awareness-modal-primary-button"));

      expect(track).toHaveBeenCalledWith(
        "button_clicked",
        expect.objectContaining({
          button: "discover flex",
          contentId: CAROUSEL_CAMPAIGN_ID,
          ctaPosition: "primary",
          link: "https://www.ledger.com/products/ledger-flex",
        }),
      );
      expect(openURL).toHaveBeenCalledWith("https://www.ledger.com/products/ledger-flex");
      await waitFor(() => {
        expect(screen.queryByTestId("generic-awareness-modal")).not.toBeInTheDocument();
      });
    });

    it("should close when the header close button is clicked", async () => {
      const { store, user } = renderModal();
      openModal(store, CAROUSEL_CAMPAIGN_ID);

      await user.click(getGenericAwarenessModalHeaderCloseButton());

      expect(track).toHaveBeenCalledWith(
        "button_clicked",
        expect.objectContaining({ button: "close", contentId: CAROUSEL_CAMPAIGN_ID }),
      );
      await waitFor(() => {
        expect(screen.queryByTestId("generic-awareness-modal")).not.toBeInTheDocument();
      });
    });
  });

  it("should close when closeGenericAwarenessModal is dispatched", async () => {
    const { store } = renderModal();
    openModal(store);

    await waitFor(() => {
      expect(screen.getByRole("dialog")).toBeVisible();
    });

    act(() => {
      dispatchGenericAwarenessModalThunk(store, closeGenericAwarenessModalDialog());
    });

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });
});
