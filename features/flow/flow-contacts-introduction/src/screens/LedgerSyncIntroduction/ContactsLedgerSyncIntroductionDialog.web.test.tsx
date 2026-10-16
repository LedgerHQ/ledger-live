import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { I18nTestProvider } from "@shared/i18n/testing";
import { ContactsLedgerSyncIntroductionDialog } from "./ContactsLedgerSyncIntroductionDialog";

function renderDialog(overrides: { onActivate?: jest.Mock; onDismiss?: jest.Mock } = {}) {
  const onActivate = overrides.onActivate ?? jest.fn();
  const onDismiss = overrides.onDismiss ?? jest.fn();

  render(
    <I18nTestProvider>
      <ContactsLedgerSyncIntroductionDialog open onActivate={onActivate} onDismiss={onDismiss} />
    </I18nTestProvider>,
  );

  return { onActivate, onDismiss };
}

describe("ContactsLedgerSyncIntroductionDialog", () => {
  it("should render the Ledger Sync explanation and dismiss it once", async () => {
    const user = userEvent.setup();
    const { onDismiss } = renderDialog();

    expect(screen.getByText("contacts.ledgerSyncIntroduction.title")).toBeVisible();
    expect(screen.getByText("contacts.ledgerSyncIntroduction.description")).toBeVisible();

    await user.click(
      screen.getByRole("button", { name: "contacts.ledgerSyncIntroduction.dismiss" }),
    );
    await user.click(
      screen.getByRole("button", { name: "contacts.ledgerSyncIntroduction.dismiss" }),
    );

    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it("should call the activation action", async () => {
    const user = userEvent.setup();
    const { onActivate } = renderDialog();

    await user.click(
      screen.getByRole("button", { name: "contacts.ledgerSyncIntroduction.activate" }),
    );

    expect(onActivate).toHaveBeenCalledTimes(1);
  });
});
