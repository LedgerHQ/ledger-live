import React from "react";
import { act, render, screen, waitFor } from "tests/testSetup";
import { setGenericAwarenessModalContentCards } from "~/renderer/reducers/genericAwarenessModalSlice";
import GenericAwarenessModal from "..";
import {
  CAROUSEL_CAMPAIGN_ID,
  FEATURE_INTRO_CAMPAIGN_ID,
  genericAwarenessModalTestContentCards,
} from "../__tests__/fixtures";
import { dispatchGenericAwarenessModalThunk } from "../__tests__/testHelpers";
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

describe("GenericAwarenessModal Integration", () => {
  const seedContentCards = (store: ReturnType<typeof renderModal>["store"]) => {
    store.dispatch(setGenericAwarenessModalContentCards(genericAwarenessModalTestContentCards));
  };

  it("should not render a dialog while the modal is closed", () => {
    renderModal();
    expect(screen.queryByTestId("generic-awareness-modal")).not.toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  describe("feature intro variant", () => {
    it("should render feature intro when opened without campaign id and close on Got it", async () => {
      const { store, user } = renderModal();

      act(() => {
        seedContentCards(store);
        dispatchGenericAwarenessModalThunk(store, openGenericAwarenessModalDialog());
      });

      await waitFor(() => {
        expect(screen.getByText("Connect a Ledger device")).toBeVisible();
      });
      expect(screen.getByText("Buy, swap, and stake")).toBeVisible();
      expect(
        screen.queryByTestId("generic-awareness-modal-continue-button"),
      ).not.toBeInTheDocument();

      await user.click(screen.getByRole("button", { name: "Got it" }));

      await waitFor(() => {
        expect(screen.queryByTestId("generic-awareness-modal")).not.toBeInTheDocument();
      });
      expect(store.getState().dialogs.GENERIC_AWARENESS_MODAL).toBe(false);
      expect(store.getState().genericAwarenessModal.campaignId).toBeUndefined();
    });

    it("should render feature intro when opened with feature intro campaign id", async () => {
      const { store } = renderModal();

      act(() => {
        seedContentCards(store);
        dispatchGenericAwarenessModalThunk(
          store,
          openGenericAwarenessModalDialog({ campaignId: FEATURE_INTRO_CAMPAIGN_ID }),
        );
      });

      await waitFor(() => {
        expect(screen.getByText("Not your keys, not your coins")).toBeVisible();
      });
      expect(screen.getByText("Offline by design")).toBeVisible();
      expect(screen.getByTestId("generic-awareness-modal").getAttribute("data-campaign-id")).toBe(
        FEATURE_INTRO_CAMPAIGN_ID,
      );
    });
  });

  describe("carousel variant", () => {
    it("should render carousel when opened with carousel campaign id", async () => {
      const { store } = renderModal();

      act(() => {
        seedContentCards(store);
        dispatchGenericAwarenessModalThunk(
          store,
          openGenericAwarenessModalDialog({ campaignId: CAROUSEL_CAMPAIGN_ID }),
        );
      });

      await waitFor(() => {
        expect(screen.getByText("Ledger Flex")).toBeVisible();
      });
      expect(
        screen.getByText(
          "The new standard to buy, swap, stake, and build your portfolio with ease.",
        ),
      ).toBeVisible();
      expect(screen.getByTestId("generic-awareness-modal-continue-button")).toBeVisible();
      expect(screen.getByRole("button", { name: "Discover Flex" })).toBeVisible();
      expect(screen.queryByText("Connect a Ledger device")).not.toBeInTheDocument();
    });

    it("should close carousel without flashing feature intro content", async () => {
      const { store } = renderModal();

      act(() => {
        seedContentCards(store);
        dispatchGenericAwarenessModalThunk(
          store,
          openGenericAwarenessModalDialog({ campaignId: CAROUSEL_CAMPAIGN_ID }),
        );
      });

      await waitFor(() => {
        expect(screen.getByText("Ledger Flex")).toBeVisible();
      });

      act(() => {
        dispatchGenericAwarenessModalThunk(store, closeGenericAwarenessModalDialog());
      });

      expect(screen.queryByText("Connect a Ledger device")).not.toBeInTheDocument();
      expect(screen.queryByText("Not your keys, not your coins")).not.toBeInTheDocument();

      await waitFor(() => {
        expect(screen.queryByTestId("generic-awareness-modal")).not.toBeInTheDocument();
      });
      expect(store.getState().genericAwarenessModal.campaignId).toBeUndefined();
    });

    it("should close when the carousel primary button is clicked", async () => {
      const { store, user } = renderModal();

      act(() => {
        seedContentCards(store);
        dispatchGenericAwarenessModalThunk(
          store,
          openGenericAwarenessModalDialog({ campaignId: CAROUSEL_CAMPAIGN_ID }),
        );
      });

      await waitFor(() => {
        expect(screen.getByRole("button", { name: "Discover Flex" })).toBeVisible();
      });

      await user.click(screen.getByTestId("generic-awareness-modal-primary-button"));

      await waitFor(() => {
        expect(screen.queryByTestId("generic-awareness-modal")).not.toBeInTheDocument();
      });
      expect(store.getState().dialogs.GENERIC_AWARENESS_MODAL).toBe(false);
    });
  });

  it("should close when closeGenericAwarenessModal is dispatched", async () => {
    const { store } = renderModal();

    act(() => {
      seedContentCards(store);
      dispatchGenericAwarenessModalThunk(store, openGenericAwarenessModalDialog());
    });

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
