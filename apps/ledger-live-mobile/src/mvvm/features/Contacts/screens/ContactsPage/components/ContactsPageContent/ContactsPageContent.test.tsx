import React from "react";
import { createClosedContactsFeatureIntroduction } from "@features/flow-contacts";
import { render, screen } from "@tests/test-renderer";
import { ContactsPageContent } from ".";
import type { ContactsPageContentProps } from "../../types";

function createViewModel({
  ledgerSyncStatus = "inactive",
  isIntroductionOpen = true,
  isFeatureIntroductionOpen = false,
  onDismiss = jest.fn(),
  onActivate = jest.fn(),
}: {
  ledgerSyncStatus?: "ready" | "checking" | "inactive";
  isIntroductionOpen?: boolean;
  isFeatureIntroductionOpen?: boolean;
  onDismiss?: jest.Mock;
  onActivate?: jest.Mock;
} = {}): ContactsPageContentProps {
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
      searchNoResults: "No contact found",
      addContact: "Add contact",
      ledgerSyncCheckingAccessibilityLabel: "Checking Ledger Sync status",
      formatAddressCount: count => `${count} address`,
    },
    meAvatarSrc: "https://example.com/black/user.png",
    searchQuery: "",
    onSearchQueryChange: jest.fn(),
    onOpenContact: jest.fn(),
    onAddContact: jest.fn(),
    ledgerSyncStatus,
    featureIntroduction: isFeatureIntroductionOpen
      ? {
          isOpen: true,
          title: "Introducing Contacts",
          description: "Your address book for crypto.",
          highlights: [],
          primaryActionLabel: "Try contacts",
          secondaryActionLabel: "Maybe later",
          onComplete: jest.fn(),
          onDefer: jest.fn(),
        }
      : createClosedContactsFeatureIntroduction(),
    ledgerSyncIntroduction: {
      isOpen: isFeatureIntroductionOpen ? false : isIntroductionOpen,
      description:
        "Your contacts are end-to-end encrypted with your Ledger and synced across your devices, only you can unlock them.",
      dismissLabel: "Got it",
      onDismiss,
    },
    ledgerSyncIntroductionContent: {
      title: "Turn on Ledger Sync to save contacts",
      activateLabel: "Turn on Ledger Sync",
      onActivate,
    },
    addContactDrawer: {
      isOpen: false,
      isConfirmEnabled: false,
      isSaving: false,
      draftName: "",
      avatarInitial: "",
      invalidNameError: null,
      labels: {
        title: "Add contact",
        namePlaceholder: "Contact name",
        namingDisclaimer: "Use a nickname.",
        confirmName: "Confirm name",
        nameValidationErrors: {
          InvalidContactNameError: "Special characters are not allowed.",
        },
      },
      onOpen: jest.fn(),
      onClose: jest.fn(),
      onDraftNameChange: jest.fn(),
      onConfirm: jest.fn(),
    },
  };
}

describe("ContactsPageContent", () => {
  it("should render the inactive introduction with the Figma labels", () => {
    render(<ContactsPageContent {...createViewModel()} />);

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
    const { user } = render(
      <ContactsPageContent {...createViewModel({ onActivate, onDismiss })} />,
    );

    await user.press(screen.getByRole("button", { name: "Turn on Ledger Sync" }));

    expect(onActivate).toHaveBeenCalledTimes(1);
    expect(onDismiss).not.toHaveBeenCalled();
    expect(screen.getByText("Turn on Ledger Sync to save contacts")).toBeVisible();
  });

  it("should dismiss the introduction from the secondary action", async () => {
    const onDismiss = jest.fn();
    const { user } = render(<ContactsPageContent {...createViewModel({ onDismiss })} />);

    await user.press(screen.getByRole("button", { name: "Got it" }));

    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it("should render the introduction when the status returns to inactive", () => {
    const { rerender } = render(
      <ContactsPageContent
        {...createViewModel({ ledgerSyncStatus: "inactive", isIntroductionOpen: false })}
      />,
    );

    expect(screen.queryByText("Turn on Ledger Sync to save contacts")).toBeNull();

    rerender(
      <ContactsPageContent
        {...createViewModel({ ledgerSyncStatus: "ready", isIntroductionOpen: false })}
      />,
    );
    rerender(<ContactsPageContent {...createViewModel({ ledgerSyncStatus: "inactive" })} />);

    expect(screen.getByText("Turn on Ledger Sync to save contacts")).toBeVisible();
  });

  it("should defer the Ledger Sync introduction while the feature introduction is open", () => {
    const onDismiss = jest.fn();
    const { rerender } = render(
      <ContactsPageContent
        {...createViewModel({
          ledgerSyncStatus: "inactive",
          isIntroductionOpen: true,
          onDismiss,
          isFeatureIntroductionOpen: true,
        })}
      />,
    );

    expect(screen.queryByText("Turn on Ledger Sync to save contacts")).toBeNull();
    expect(screen.getByTestId("contacts-feature-introduction-primary")).toBeVisible();

    rerender(
      <ContactsPageContent
        {...createViewModel({
          ledgerSyncStatus: "inactive",
          isIntroductionOpen: true,
          onDismiss,
          isFeatureIntroductionOpen: false,
        })}
      />,
    );

    expect(screen.getByText("Turn on Ledger Sync to save contacts")).toBeVisible();
  });
});
