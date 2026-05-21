import React from "react";
import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Provider } from "react-redux";
import type { AppDispatch } from "~/state-manager/configureStore";
import createStore from "~/state-manager/configureStore";
import { setGenericAwarenessModalContentCards } from "~/renderer/reducers/genericAwarenessModalSlice";
import GenericAwarenessModal from "..";
import {
  closeGenericAwarenessModalDialog,
  openGenericAwarenessModalDialog,
} from "../genericAwarenessModalDialog";
import { genericAwarenessModalTestContentCards } from "../__tests__/fixtures";

const renderModal = () => {
  const store = createStore({});
  const user = userEvent.setup();
  const view = render(
    <Provider store={store}>
      <GenericAwarenessModal />
    </Provider>,
  );
  return { store, user, ...view };
};

describe("GenericAwarenessModal Integration", () => {
  const dispatchThunk = (
    store: { dispatch: unknown },
    thunk:
      | ReturnType<typeof openGenericAwarenessModalDialog>
      | ReturnType<typeof closeGenericAwarenessModalDialog>,
  ) => {
    (store.dispatch as AppDispatch)(thunk);
  };

  const seedContentCards = (store: { dispatch: unknown }) => {
    (store.dispatch as AppDispatch)(
      setGenericAwarenessModalContentCards(genericAwarenessModalTestContentCards),
    );
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
        dispatchThunk(store, openGenericAwarenessModalDialog());
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
      expect(store.getState().genericAwarenessModalDialog.campaignId).toBeUndefined();
    });

    it("should render feature intro when opened with odd campaign id", async () => {
      const { store } = renderModal();

      act(() => {
        seedContentCards(store);
        dispatchThunk(store, openGenericAwarenessModalDialog({ campaignId: "1" }));
      });

      await waitFor(() => {
        expect(screen.getByText("Not your keys, not your coins")).toBeVisible();
      });
      expect(screen.getByText("Offline by design")).toBeVisible();
      expect(screen.getByTestId("generic-awareness-modal").getAttribute("data-campaign-id")).toBe(
        "1",
      );
    });
  });

  describe("carousel variant", () => {
    it("should render carousel when opened with even campaign id", async () => {
      const { store } = renderModal();

      act(() => {
        seedContentCards(store);
        dispatchThunk(store, openGenericAwarenessModalDialog({ campaignId: "2" }));
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
        dispatchThunk(store, openGenericAwarenessModalDialog({ campaignId: "2" }));
      });

      await waitFor(() => {
        expect(screen.getByText("Ledger Flex")).toBeVisible();
      });

      act(() => {
        dispatchThunk(store, closeGenericAwarenessModalDialog());
      });

      expect(screen.queryByText("Connect a Ledger device")).not.toBeInTheDocument();
      expect(screen.queryByText("Not your keys, not your coins")).not.toBeInTheDocument();

      await waitFor(() => {
        expect(screen.queryByTestId("generic-awareness-modal")).not.toBeInTheDocument();
      });
      expect(store.getState().genericAwarenessModalDialog.campaignId).toBeUndefined();
    });

    it("should close when the carousel primary button is clicked", async () => {
      const { store, user } = renderModal();

      act(() => {
        seedContentCards(store);
        dispatchThunk(store, openGenericAwarenessModalDialog({ campaignId: "2" }));
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
      dispatchThunk(store, openGenericAwarenessModalDialog());
    });

    await waitFor(() => {
      expect(screen.getByRole("dialog")).toBeVisible();
    });

    act(() => {
      dispatchThunk(store, closeGenericAwarenessModalDialog());
    });

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });
});
