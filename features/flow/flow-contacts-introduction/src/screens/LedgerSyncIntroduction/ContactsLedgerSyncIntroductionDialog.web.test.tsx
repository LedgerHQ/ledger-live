import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ContactsLedgerSyncIntroductionDialog } from "./ContactsLedgerSyncIntroductionDialog";

function renderDialog(overrides: { onActivate?: jest.Mock; onDismiss?: jest.Mock } = {}) {
  const onActivate = overrides.onActivate ?? jest.fn();
  const onDismiss = overrides.onDismiss ?? jest.fn();

  render(
    <ContactsLedgerSyncIntroductionDialog
      open
      title="Sync your wallet to add a contact"
      description="Contacts are end-to-end encrypted and synced across Ledger Wallet."
      activateLabel="Sync my wallet"
      dismissLabel="Not now"
      onActivate={onActivate}
      onDismiss={onDismiss}
    />,
  );

  return { onActivate, onDismiss };
}

describe("ContactsLedgerSyncIntroductionDialog", () => {
  it("should render the Ledger Sync explanation and dismiss it once", async () => {
    const user = userEvent.setup();
    const { onDismiss } = renderDialog();

    expect(screen.getByText("Sync your wallet to add a contact")).toBeVisible();
    expect(
      screen.getByText("Contacts are end-to-end encrypted and synced across Ledger Wallet."),
    ).toBeVisible();

    await user.click(screen.getByRole("button", { name: "Not now" }));
    await user.click(screen.getByRole("button", { name: "Not now" }));

    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it("should call the activation action", async () => {
    const user = userEvent.setup();
    const { onActivate } = renderDialog();

    await user.click(screen.getByRole("button", { name: "Sync my wallet" }));

    expect(onActivate).toHaveBeenCalledTimes(1);
  });
});
