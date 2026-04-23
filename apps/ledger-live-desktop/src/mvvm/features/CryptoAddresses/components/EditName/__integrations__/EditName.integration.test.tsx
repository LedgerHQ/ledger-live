import React from "react";
import { render, screen, waitFor, fireEvent } from "tests/testSetup";
import { Button } from "@ledgerhq/lumen-ui-react";
import { ETH_ACCOUNT } from "LLD/features/__mocks__/accounts.mock";
import { EditName } from "LLD/features/CryptoAddresses/components/EditName";

/** How long the ghost-click guard blocks outside-click closes (must match the component). */
const GHOST_CLICK_GUARD_MS = 300;

const ASSET_NAME = "Ethereum";

const renderEditName = () => {
  return render(
    <EditName account={ETH_ACCOUNT} asset={ASSET_NAME}>
      <Button data-testid="edit-name-trigger">Edit</Button>
    </EditName>,
    { initialState: { accounts: [ETH_ACCOUNT] } },
  );
};

describe("EditName", () => {
  it("stays open when outside is clicked within the ghost-click guard window", async () => {
    const { user } = renderEditName();

    await user.click(screen.getByTestId("edit-name-trigger"));
    await waitFor(() => {
      expect(screen.getByTestId("edit-crypto-address-name-dialog-content")).toBeVisible();
    });

    // Immediately fire an outside pointerdown (within the 300ms guard window)
    fireEvent.pointerDown(document);

    // Dialog must still be open
    expect(screen.getByTestId("edit-crypto-address-name-dialog-content")).toBeVisible();
  });

  it("closes when outside is clicked after the ghost-click guard window", async () => {
    const { user } = renderEditName();

    await user.click(screen.getByTestId("edit-name-trigger"));
    await waitFor(() => {
      expect(screen.getByTestId("edit-crypto-address-name-dialog-content")).toBeVisible();
    });

    // Wait past the guard window then simulate an outside click
    await new Promise(r => setTimeout(r, GHOST_CLICK_GUARD_MS + 50));
    fireEvent.pointerDown(document);

    await waitFor(() => {
      expect(
        screen.queryByTestId("edit-crypto-address-name-dialog-content"),
      ).not.toBeInTheDocument();
    });
  });

  it("should open dialog, interact with chips and input, confirm, then reopen and close via X", async () => {
    const { user, store } = renderEditName();

    expect(screen.queryByTestId("edit-crypto-address-name-dialog-content")).not.toBeInTheDocument();

    await user.click(screen.getByTestId("edit-name-trigger"));
    await waitFor(() => {
      expect(screen.getByTestId("edit-crypto-address-name-dialog-content")).toBeVisible();
    });

    const input = screen.getByLabelText("Address name");
    expect(input).toBeVisible();
    expect(input).toHaveValue("Ethereum 2");

    expect(screen.getByRole("button", { name: "Ethereum trading" })).toBeVisible();
    const savingsChip = screen.getByRole("button", { name: "Ethereum savings" });
    expect(savingsChip).toBeVisible();

    const confirmButton = screen.getByTestId("edit-crypto-address-name-dialog-cta");
    expect(confirmButton).toBeDisabled();

    await user.click(savingsChip);
    expect(input).toHaveValue("Ethereum savings");
    expect(confirmButton).toBeEnabled();

    await user.clear(input);
    expect(confirmButton).toBeDisabled();

    await user.type(input, "My ETH wallet");
    expect(input).toHaveValue("My ETH wallet");
    expect(confirmButton).toBeEnabled();

    await user.click(confirmButton);
    await waitFor(() => {
      expect(
        screen.queryByTestId("edit-crypto-address-name-dialog-content"),
      ).not.toBeInTheDocument();
    });

    await waitFor(() => {
      expect(store.getState().wallet.accountNames.get(ETH_ACCOUNT.id)).toBe("My ETH wallet");
    });

    await user.click(screen.getByTestId("edit-name-trigger"));
    await waitFor(() => {
      expect(screen.getByTestId("edit-crypto-address-name-dialog-content")).toBeVisible();
    });

    const closeButton = screen.getByRole("button", { name: /close/i });
    await user.click(closeButton);
    await waitFor(() => {
      expect(
        screen.queryByTestId("edit-crypto-address-name-dialog-content"),
      ).not.toBeInTheDocument();
    });
  });
});
