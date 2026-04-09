import React from "react";
import { render, screen, waitFor, act } from "tests/testSetup";
import { openURL } from "~/renderer/linking";
import {
  setPtxInfoDialog,
  clearPtxInfoDialog,
} from "~/renderer/reducers/ptxInfoDialog";
import PtxInfoDialog from "..";

jest.mock("~/renderer/linking", () => ({
  openURL: jest.fn(),
}));

describe("PtxInfoDialog Integration", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("rendering", () => {
    it("should not render a dialog when store is empty", () => {
      render(<PtxInfoDialog />);
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    it("should render title and message when opened", async () => {
      const { store } = render(<PtxInfoDialog />);

      act(() => {
        store.dispatch(
          setPtxInfoDialog({
            title: "How staking works",
            message: "Delegate tokens to a validator to earn rewards.",
          }),
        );
      });

      await waitFor(() => {
        expect(screen.getByRole("dialog", { name: "How staking works" })).toBeVisible();
      });
      expect(screen.getByText(/Delegate tokens to a validator/)).toBeVisible();
    });
  });

  describe("link behavior", () => {
    it("should render a link when linkText and linkHref are provided", async () => {
      const { store } = render(<PtxInfoDialog />);

      act(() => {
        store.dispatch(
          setPtxInfoDialog({
            title: "Staking info",
            message: "Learn more about staking.",
            linkText: "Read the guide",
            linkHref: "https://support.ledger.com/staking",
          }),
        );
      });

      await waitFor(() => {
        expect(screen.getByRole("dialog")).toBeVisible();
      });
      expect(screen.getByText("Read the guide")).toBeVisible();
    });

    it("should not render a link when linkHref is absent", async () => {
      const { store } = render(<PtxInfoDialog />);

      act(() => {
        store.dispatch(
          setPtxInfoDialog({
            title: "No link dialog",
            message: "No link here.",
            linkText: "Orphaned text",
          }),
        );
      });

      await waitFor(() => {
        expect(screen.getByRole("dialog")).toBeVisible();
      });
      expect(screen.queryByText("Orphaned text")).not.toBeInTheDocument();
    });

    it("should call openURL when the link is clicked", async () => {
      const { store, user } = render(<PtxInfoDialog />);

      act(() => {
        store.dispatch(
          setPtxInfoDialog({
            title: "Click test",
            message: "Try clicking.",
            linkText: "Learn more",
            linkHref: "https://www.ledger.com/academy",
          }),
        );
      });

      await waitFor(() => {
        expect(screen.getByText("Learn more")).toBeVisible();
      });

      await user.click(screen.getByText("Learn more"));
      expect(openURL).toHaveBeenCalledWith("https://www.ledger.com/academy");
    });
  });

  describe("closing", () => {
    it("should close when clearPtxInfoDialog is dispatched", async () => {
      const { store } = render(<PtxInfoDialog />);

      act(() => {
        store.dispatch(
          setPtxInfoDialog({ title: "Closing test", message: "Will close soon." }),
        );
      });

      await waitFor(() => {
        expect(screen.getByRole("dialog")).toBeVisible();
      });

      act(() => {
        store.dispatch(clearPtxInfoDialog());
      });

      await waitFor(() => {
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      });
    });
  });
});
