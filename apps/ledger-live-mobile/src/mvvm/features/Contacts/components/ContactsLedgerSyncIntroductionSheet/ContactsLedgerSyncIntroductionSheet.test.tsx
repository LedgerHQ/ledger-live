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
        title="Sync your wallet to add a contact"
        description="Your contacts are encrypted."
        activateLabel="Sync my wallet"
        dismissLabel="Not now"
        onActivate={onActivate}
        onDismiss={onDismiss}
      />,
    );

    await user.press(screen.getByRole("button", { name: "Sync my wallet" }));
    await user.press(screen.getByRole("button", { name: "Not now" }));

    expect(onActivate).toHaveBeenCalledTimes(1);
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });
});
