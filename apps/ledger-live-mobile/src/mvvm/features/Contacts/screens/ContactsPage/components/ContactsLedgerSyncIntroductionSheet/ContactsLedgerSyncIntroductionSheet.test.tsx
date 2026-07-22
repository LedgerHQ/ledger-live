import React from "react";
import { render, screen } from "@tests/test-renderer";
import { ContactsLedgerSyncIntroductionSheet } from ".";

describe("ContactsLedgerSyncIntroductionSheet", () => {
  it("should call the activation and dismissal actions", async () => {
    const onActivate = jest.fn();
    const onDismiss = jest.fn();
    const { user } = render(
      <ContactsLedgerSyncIntroductionSheet
        isOpen
        title="Turn on Ledger Sync to save contacts"
        description="Your contacts are encrypted."
        activateLabel="Turn on Ledger Sync"
        dismissLabel="Got it"
        onActivate={onActivate}
        onDismiss={onDismiss}
      />,
    );

    await user.press(screen.getByRole("button", { name: "Turn on Ledger Sync" }));
    await user.press(screen.getByRole("button", { name: "Got it" }));

    expect(onActivate).toHaveBeenCalledTimes(1);
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });
});
