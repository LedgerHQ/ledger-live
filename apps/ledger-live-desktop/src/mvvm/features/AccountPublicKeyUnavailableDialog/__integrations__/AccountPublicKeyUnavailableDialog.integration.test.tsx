import React from "react";
import { render, screen, waitFor, act } from "tests/testSetup";
import { urls } from "~/config/urls";
import { openURL } from "~/renderer/linking";
import AccountPublicKeyUnavailableDialog from "..";
import {
  openAccountPublicKeyUnavailableDialog,
  selectIsAccountPublicKeyUnavailableDialogOpen,
} from "../accountPublicKeyUnavailableDialog";

jest.mock("~/renderer/linking", () => ({
  openURL: jest.fn(),
}));

describe("AccountPublicKeyUnavailableDialog Integration", () => {
  beforeEach(() => {
    (openURL as jest.Mock).mockClear();
  });

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
    expect(screen.getByRole("button", { name: /learn more/i })).toBeVisible();
  });

  it("opens the support article when the Learn more CTA is clicked", async () => {
    const { store, user } = render(<AccountPublicKeyUnavailableDialog />);

    act(() => {
      store.dispatch(openAccountPublicKeyUnavailableDialog());
    });
    await waitFor(() => expect(screen.getByRole("dialog")).toBeVisible());

    await user.click(screen.getByRole("button", { name: /learn more/i }));

    expect(openURL).toHaveBeenCalledWith(urls.accountPublicKeyUnavailable);
    expect(selectIsAccountPublicKeyUnavailableDialogOpen(store.getState())).toBe(true);
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
