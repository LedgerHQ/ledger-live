import React from "react";
import { render, screen, waitFor, act } from "tests/testSetup";
import AccountPublicKeyUnavailableDialog from "..";
import {
  openAccountPublicKeyUnavailableDialog,
  selectIsAccountPublicKeyUnavailableDialogOpen,
} from "../accountPublicKeyUnavailableDialog";

describe("AccountPublicKeyUnavailableDialog Integration", () => {
  it("does not render a dialog while the dialog state is closed", () => {
    render(<AccountPublicKeyUnavailableDialog />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("renders the title, description and CTA when opened", async () => {
    const { store } = render(<AccountPublicKeyUnavailableDialog />);

    act(() => {
      store.dispatch(openAccountPublicKeyUnavailableDialog());
    });

    await waitFor(() => expect(screen.getByRole("dialog")).toBeVisible());
    expect(screen.getByText("Account needs to be added again")).toBeVisible();
    expect(
      screen.getByText(/Ledger Wallet could not retrieve this account's public key/),
    ).toBeVisible();
    expect(screen.getByRole("button", { name: /^OK$/i })).toBeVisible();
  });

  it("closes the dialog when the OK CTA is clicked", async () => {
    const { store, user } = render(<AccountPublicKeyUnavailableDialog />);

    act(() => {
      store.dispatch(openAccountPublicKeyUnavailableDialog());
    });
    await waitFor(() => expect(screen.getByRole("dialog")).toBeVisible());

    await user.click(screen.getByRole("button", { name: /^OK$/i }));

    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(selectIsAccountPublicKeyUnavailableDialogOpen(store.getState())).toBe(false);
  });

  it("closes the dialog when the header close button is clicked", async () => {
    const { store, user } = render(<AccountPublicKeyUnavailableDialog />);

    act(() => {
      store.dispatch(openAccountPublicKeyUnavailableDialog());
    });
    await waitFor(() => expect(screen.getByRole("dialog")).toBeVisible());

    await user.click(screen.getByRole("button", { name: /close/i }));

    await waitFor(() =>
      expect(selectIsAccountPublicKeyUnavailableDialogOpen(store.getState())).toBe(false),
    );
  });
});
