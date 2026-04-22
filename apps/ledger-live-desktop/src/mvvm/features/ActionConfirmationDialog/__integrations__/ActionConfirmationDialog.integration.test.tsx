import React from "react";
import { render, screen, waitFor, act } from "tests/testSetup";
import { resolveActionDialog } from "~/renderer/components/WebPTXPlayer/actionDialogStore";
import { setActionDialog } from "~/renderer/reducers/actionDialog";
import ActionConfirmationDialog from "..";

jest.mock("~/renderer/components/WebPTXPlayer/actionDialogStore", () => ({
  resolveActionDialog: jest.fn(),
}));

const mockedResolve = jest.mocked(resolveActionDialog);

describe("ActionConfirmationDialog Integration", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("rendering", () => {
    it("should not render a dialog when store is empty", () => {
      render(<ActionConfirmationDialog />);
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    it("should render title, description, and CTA when opened", async () => {
      const { store } = render(<ActionConfirmationDialog />);

      act(() => {
        store.dispatch(
          setActionDialog({
            title: "Swap required",
            description: "You need to swap first",
            ctaLabel: "Go to Swap",
          }),
        );
      });

      await waitFor(() => {
        expect(screen.getByRole("dialog")).toBeVisible();
      });
      expect(screen.getByText("Swap required")).toBeVisible();
      expect(screen.getByText("You need to swap first")).toBeVisible();
      expect(screen.getByText("Go to Swap")).toBeVisible();
    });
  });

  describe("user interactions", () => {
    it("should call resolveActionDialog(true) when confirm button is clicked", async () => {
      const { store, user } = render(<ActionConfirmationDialog />);

      act(() => {
        store.dispatch(
          setActionDialog({
            title: "Confirm action",
            description: "Are you sure?",
            ctaLabel: "Confirm",
          }),
        );
      });

      await waitFor(() => {
        expect(screen.getByRole("dialog")).toBeVisible();
      });

      await user.click(screen.getByText("Confirm"));
      expect(mockedResolve).toHaveBeenCalledWith(true);
    });

    it("should call resolveActionDialog(false) when close button is clicked", async () => {
      const { store, user } = render(<ActionConfirmationDialog />);

      act(() => {
        store.dispatch(
          setActionDialog({
            title: "Dismiss test",
            description: "Will dismiss",
            ctaLabel: "OK",
          }),
        );
      });

      await waitFor(() => {
        expect(screen.getByRole("dialog")).toBeVisible();
      });

      await user.click(screen.getByRole("button", { name: /close/i }));
      expect(mockedResolve).toHaveBeenCalledWith(false);
    });
  });

  describe("closing", () => {
    it("should close when actionDialog is cleared", async () => {
      const { store } = render(<ActionConfirmationDialog />);

      act(() => {
        store.dispatch(
          setActionDialog({
            title: "Closing test",
            description: "Will close soon.",
            ctaLabel: "OK",
          }),
        );
      });

      await waitFor(() => {
        expect(screen.getByRole("dialog")).toBeVisible();
      });

      act(() => {
        store.dispatch(setActionDialog(null));
      });

      await waitFor(() => {
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      });
    });
  });
});
