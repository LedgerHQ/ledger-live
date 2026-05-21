import React from "react";
import { render, screen, waitFor, act } from "tests/testSetup";
import type { AppDispatch } from "~/state-manager/configureStore";
import GenericAwarenessModal from "..";
import { closeGenericAwarenessModal, openGenericAwarenessModal } from "../genericAwarenessModal";

describe("GenericAwarenessModal Integration", () => {
  const dispatchThunk = (
    store: { dispatch: unknown },
    thunk:
      | ReturnType<typeof openGenericAwarenessModal>
      | ReturnType<typeof closeGenericAwarenessModal>,
  ) => {
    (store.dispatch as AppDispatch)(thunk);
  };

  it("should not render a dialog while the modal is closed", () => {
    render(<GenericAwarenessModal />);
    expect(screen.queryByTestId("generic-awareness-modal")).not.toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  describe("feature intro variant", () => {
    it("should render feature intro when opened without campaign id and close on Got it", async () => {
      const { store, user } = render(<GenericAwarenessModal />);

      act(() => {
        dispatchThunk(store, openGenericAwarenessModal());
      });

      await waitFor(() => {
        expect(screen.getByText("Connect a Ledger device")).toBeVisible();
      });
      expect(screen.getByText("Swap and bridge")).toBeVisible();
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

    it("should render feature intro when opened with odd campaign id", async () => {
      const { store } = render(<GenericAwarenessModal />);

      act(() => {
        dispatchThunk(store, openGenericAwarenessModal({ campaignId: "1" }));
      });

      await waitFor(() => {
        expect(screen.getByText("Connect a Ledger device")).toBeVisible();
      });
      expect(screen.getByTestId("generic-awareness-modal").getAttribute("data-campaign-id")).toBe(
        "1",
      );
    });
  });

  describe("carousel variant", () => {
    it("should render carousel when opened with even campaign id", async () => {
      const { store } = render(<GenericAwarenessModal />);

      act(() => {
        dispatchThunk(store, openGenericAwarenessModal({ campaignId: "2" }));
      });

      await waitFor(() => {
        expect(screen.getByText("Your portfolio at a glance")).toBeVisible();
      });
      expect(screen.getByText("See balances and accounts in one secure dashboard.")).toBeVisible();
      expect(screen.getByTestId("generic-awareness-modal-continue-button")).toBeVisible();
      expect(screen.getByRole("button", { name: "Learn more" })).toBeVisible();
      expect(screen.queryByText("Connect a Ledger device")).not.toBeInTheDocument();
    });

    it("should close carousel without flashing feature intro content", async () => {
      const { store } = render(<GenericAwarenessModal />);

      act(() => {
        dispatchThunk(store, openGenericAwarenessModal({ campaignId: "2" }));
      });

      await waitFor(() => {
        expect(screen.getByText("Your portfolio at a glance")).toBeVisible();
      });

      act(() => {
        dispatchThunk(store, closeGenericAwarenessModal());
      });

      expect(screen.queryByText("Connect a Ledger device")).not.toBeInTheDocument();

      await waitFor(() => {
        expect(screen.queryByTestId("generic-awareness-modal")).not.toBeInTheDocument();
      });
      expect(store.getState().genericAwarenessModal.campaignId).toBeUndefined();
    });

    it("should close when the carousel primary button is clicked", async () => {
      const { store, user } = render(<GenericAwarenessModal />);

      act(() => {
        dispatchThunk(store, openGenericAwarenessModal({ campaignId: "0" }));
      });

      await waitFor(() => {
        expect(screen.getByRole("button", { name: "Learn more" })).toBeVisible();
      });

      await user.click(screen.getByTestId("generic-awareness-modal-primary-button"));

      await waitFor(() => {
        expect(screen.queryByTestId("generic-awareness-modal")).not.toBeInTheDocument();
      });
      expect(store.getState().dialogs.GENERIC_AWARENESS_MODAL).toBe(false);
    });
  });

  it("should close when closeGenericAwarenessModal is dispatched", async () => {
    const { store } = render(<GenericAwarenessModal />);

    act(() => {
      dispatchThunk(store, openGenericAwarenessModal());
    });

    await waitFor(() => {
      expect(screen.getByRole("dialog")).toBeVisible();
    });

    act(() => {
      dispatchThunk(store, closeGenericAwarenessModal());
    });

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });
});
