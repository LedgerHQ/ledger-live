import React from "react";
import { render, screen } from "@tests/test-renderer";
import { ContactsView } from "./ContactsView";
import type { ContactsViewModel } from "./useContactsViewModel";

function createViewModel({
  ledgerSyncStatus = "inactive",
  isIntroductionOpen = true,
  onDismiss = jest.fn(),
  onActivate = jest.fn(),
}: {
  ledgerSyncStatus?: "ready" | "checking" | "inactive";
  isIntroductionOpen?: boolean;
  onDismiss?: jest.Mock;
  onActivate?: jest.Mock;
} = {}): ContactsViewModel {
  return {
    viewModel: {
      displayMode: "empty",
      me: {
        contactId: "contact-me" as never,
        name: "Me",
        initial: "M",
        addressCount: 0,
      },
    },
    labels: {
      title: "Contacts",
      searchPlaceholder: "Search contact",
      addContact: "Add contact",
      ledgerSyncCheckingAccessibilityLabel: "Checking Ledger Sync status",
      formatAddressCount: count => `${count} address`,
    },
    meAvatarSrc: "https://example.com/black/user.png",
    onOpenContact: jest.fn(),
    onAddContact: jest.fn(),
    ledgerSyncStatus,
    ledgerSyncIntroduction: {
      isOpen: isIntroductionOpen,
      description:
        "Your contacts are end-to-end encrypted with your Ledger and synced across your devices, only you can unlock them.",
      dismissLabel: "Got it",
      onDismiss,
    },
    ledgerSyncIntroductionSheet: {
      title: "Turn on Ledger Sync to save contacts",
      activateLabel: "Turn on Ledger Sync",
      onActivate,
    },
  };
}

describe("ContactsView", () => {
  it("should render the inactive introduction with the Figma labels", () => {
    render(<ContactsView {...createViewModel()} />);

    expect(screen.getByTestId("contacts-screen")).toBeVisible();
    expect(screen.getByText("Turn on Ledger Sync to save contacts")).toBeVisible();
    expect(
      screen.getByText(
        "Your contacts are end-to-end encrypted with your Ledger and synced across your devices, only you can unlock them.",
      ),
    ).toBeVisible();
    expect(screen.getByRole("button", { name: "Turn on Ledger Sync" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Got it" })).toBeEnabled();
  });

  it("should keep the introduction open when activating Ledger Sync", async () => {
    const onActivate = jest.fn();
    const onDismiss = jest.fn();
    const { user } = render(<ContactsView {...createViewModel({ onActivate, onDismiss })} />);

    await user.press(screen.getByRole("button", { name: "Turn on Ledger Sync" }));

    expect(onActivate).toHaveBeenCalledTimes(1);
    expect(onDismiss).not.toHaveBeenCalled();
    expect(screen.getByText("Turn on Ledger Sync to save contacts")).toBeVisible();
  });

  it("should dismiss the introduction from the secondary action", async () => {
    const onDismiss = jest.fn();
    const { user } = render(<ContactsView {...createViewModel({ onDismiss })} />);

    await user.press(screen.getByRole("button", { name: "Got it" }));

    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it("should render the introduction when the status returns to inactive", () => {
    const { rerender } = render(
      <ContactsView
        {...createViewModel({ ledgerSyncStatus: "inactive", isIntroductionOpen: false })}
      />,
    );

    expect(screen.queryByText("Turn on Ledger Sync to save contacts")).toBeNull();

    rerender(
      <ContactsView
        {...createViewModel({ ledgerSyncStatus: "ready", isIntroductionOpen: false })}
      />,
    );
    rerender(<ContactsView {...createViewModel({ ledgerSyncStatus: "inactive" })} />);

    expect(screen.getByText("Turn on Ledger Sync to save contacts")).toBeVisible();
  });
});
