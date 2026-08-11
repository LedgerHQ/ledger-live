import React from "react";
import { fireEvent, render, screen } from "@testing-library/react-native";
import { ContactsLedgerSyncIntroductionContent } from "./ContactsLedgerSyncIntroduction.native";

function renderContent(isOpen = true) {
  const onActivate = jest.fn();
  const onDismiss = jest.fn();

  render(
    <ContactsLedgerSyncIntroductionContent
      isOpen={isOpen}
      title="Keep contacts in sync"
      description="Ledger Sync protects your contacts across devices."
      activateLabel="Activate Ledger Sync"
      dismissLabel="Not now"
      bottomInset={12}
      onActivate={onActivate}
      onDismiss={onDismiss}
    />,
  );

  return { onActivate, onDismiss };
}

describe("ContactsLedgerSyncIntroductionContent", () => {
  it("should render the native Ledger Sync introduction and dispatch its actions", () => {
    const { onActivate, onDismiss } = renderContent();

    expect(screen.getByText("Keep contacts in sync")).toBeVisible();

    fireEvent.press(screen.getByText("Activate Ledger Sync"));
    fireEvent.press(screen.getByText("Not now"));

    expect(onActivate).toHaveBeenCalledTimes(1);
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it("should hide the Ledger Sync introduction when it is closed", () => {
    renderContent(false);

    expect(screen.queryByText("Keep contacts in sync")).toBeNull();
  });
});
