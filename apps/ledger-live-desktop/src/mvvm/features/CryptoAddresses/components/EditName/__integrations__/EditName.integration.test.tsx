import React from "react";
import { render, screen, waitFor, fireEvent } from "tests/testSetup";
import { Button } from "@ledgerhq/lumen-ui-react";
import { ETH_ACCOUNT } from "LLD/features/__mocks__/accounts.mock";
import { EditName } from "LLD/features/CryptoAddresses/components/EditName";

// Stub the device runner — renaming an account now re-registers it on
// the Ledger device (DMK registerLedgerAccount), and the local rename
// only commits once the runner reports success. The stub exposes a
// button that simulates the user approving on the device.
jest.mock(
  "~/mvvm/features/Contacts/components/RunDeviceAction",
  () => ({
    __esModule: true,
    default: ({ onDone }: { onDone: (ok: boolean) => void }) => (
      <button
        type="button"
        data-testid="run-device-action-stub"
        onClick={() => onDone(true)}
      >
        run-device-action-stub
      </button>
    ),
  }),
);

/** How long the ghost-click guard blocks outside-click closes (must match the component). */
const GHOST_CLICK_GUARD_MS = 300;

const renderEditName = () => {
  return render(
    <EditName account={ETH_ACCOUNT}>
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

  it("does not render name suggestions below the input", async () => {
    const { user } = renderEditName();

    await user.click(screen.getByTestId("edit-name-trigger"));
    await waitFor(() => {
      expect(screen.getByTestId("edit-crypto-address-name-dialog-content")).toBeVisible();
    });

    // The suggestion chips ("<asset> trading" / "<asset> savings") are gone.
    expect(screen.queryByRole("button", { name: "Ethereum trading" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Ethereum savings" })).not.toBeInTheDocument();
  });

  it("renames through the device flow: confirm opens the runner, approval commits the name", async () => {
    const { user, store } = renderEditName();

    expect(screen.queryByTestId("edit-crypto-address-name-dialog-content")).not.toBeInTheDocument();

    await user.click(screen.getByTestId("edit-name-trigger"));
    await waitFor(() => {
      expect(screen.getByTestId("edit-crypto-address-name-dialog-content")).toBeVisible();
    });

    const input = screen.getByLabelText("Address name");
    expect(input).toBeVisible();
    expect(input).toHaveValue("Ethereum 2");

    const confirmButton = screen.getByTestId("edit-crypto-address-name-dialog-cta");
    expect(confirmButton).toBeDisabled();

    await user.clear(input);
    expect(confirmButton).toBeDisabled();

    await user.type(input, "My ETH wallet");
    expect(input).toHaveValue("My ETH wallet");
    expect(confirmButton).toBeEnabled();

    // Confirm → the dialog switches to the device step (the local
    // rename has NOT happened yet).
    await user.click(confirmButton);
    expect(screen.getByTestId("run-device-action-stub")).toBeInTheDocument();
    expect(store.getState().wallet.accountNames.get(ETH_ACCOUNT.id)).not.toBe("My ETH wallet");

    // Device approves → rename commits locally and the dialog closes.
    await user.click(screen.getByTestId("run-device-action-stub"));
    await waitFor(() => {
      expect(
        screen.queryByTestId("edit-crypto-address-name-dialog-content"),
      ).not.toBeInTheDocument();
    });
    await waitFor(() => {
      expect(store.getState().wallet.accountNames.get(ETH_ACCOUNT.id)).toBe("My ETH wallet");
    });

    // Reopen, then close via X.
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
