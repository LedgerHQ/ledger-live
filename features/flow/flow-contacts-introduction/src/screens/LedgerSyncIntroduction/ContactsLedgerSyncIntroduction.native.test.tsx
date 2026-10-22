import React from "react";
import { fireEvent, render, screen } from "@testing-library/react-native";
import { I18nTestProvider } from "@shared/i18n/testing";
import { ContactsLedgerSyncIntroductionContent } from "./ContactsLedgerSyncIntroduction";

function renderContent(isOpen = true) {
  const onActivate = jest.fn();
  const onDismiss = jest.fn();

  render(
    <ContactsLedgerSyncIntroductionContent
      isOpen={isOpen}
      bottomInset={12}
      onActivate={onActivate}
      onDismiss={onDismiss}
    />,
    { wrapper: I18nTestProvider },
  );

  return { onActivate, onDismiss };
}

describe("ContactsLedgerSyncIntroductionContent", () => {
  it("should render the native Ledger Sync introduction and dispatch its actions", () => {
    const { onActivate, onDismiss } = renderContent();

    expect(screen.getByText("contacts.ledgerSyncIntroduction.title")).toBeVisible();

    fireEvent.press(screen.getByText("contacts.ledgerSyncIntroduction.activate"));
    fireEvent.press(screen.getByText("contacts.ledgerSyncIntroduction.dismiss"));

    expect(onActivate).toHaveBeenCalledTimes(1);
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it("should hide the Ledger Sync introduction when it is closed", () => {
    renderContent(false);

    expect(screen.queryByText("contacts.ledgerSyncIntroduction.title")).toBeNull();
  });
});
