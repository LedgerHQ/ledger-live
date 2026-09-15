import React from "react";
import { render, screen } from "@tests/test-renderer";
import { ContactsLedgerSyncIntroductionSheet } from ".";

describe("ContactsLedgerSyncIntroductionSheet", () => {
  it("should call the activation action without dismissing when the sheet closes", async () => {
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
    await user.press(screen.getByRole("button", { name: "Close" }));

    expect(onActivate).toHaveBeenCalledTimes(1);
    expect(onDismiss).not.toHaveBeenCalled();
  });

  it("should call the dismissal action once when the dismissed sheet closes", async () => {
    const onDismiss = jest.fn();
    const { user } = render(
      <ContactsLedgerSyncIntroductionSheet
        isOpen
        title="Sync your wallet to add a contact"
        description="Your contacts are encrypted."
        activateLabel="Sync my wallet"
        dismissLabel="Not now"
        onActivate={jest.fn()}
        onDismiss={onDismiss}
      />,
    );

    await user.press(screen.getByRole("button", { name: "Not now" }));
    await user.press(screen.getByRole("button", { name: "Close" }));

    expect(onDismiss).toHaveBeenCalledTimes(1);
  });
});
