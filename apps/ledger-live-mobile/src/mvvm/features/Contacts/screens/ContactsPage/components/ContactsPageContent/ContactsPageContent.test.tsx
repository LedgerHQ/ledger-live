import React from "react";
import { createClosedContactsFeatureIntroduction } from "@features/flow-contacts-introduction";
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
  ledgerSyncStatus?: "ready" | "checking" | "inactive" | "unavailable";
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
    onRequestAddContact: jest.fn(),
    ledgerSyncStatus,
    featureIntroduction: isFeatureIntroductionOpen
      ? {
          isOpen: true,
          title: "Introducing Contacts",
          highlights: [],
          primaryActionLabel: "Explore now",
          onComplete: jest.fn(),
          onClose: jest.fn(),
        }
      : createClosedContactsFeatureIntroduction(),
    ledgerSyncIntroduction: {
      isOpen: isFeatureIntroductionOpen ? false : isIntroductionOpen,
      title: "Sync your wallet to add a contact",
      description:
        "Contacts are end-to-end encrypted and synced across Ledger Wallet on all your phones and computers.",
      activateLabel: "Sync my wallet",
      dismissLabel: "Not now",
      onActivate,
      onDismiss,
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
          DuplicateContactNameError: "This contact name is already in use.",
        },
      },
      onOpen: jest.fn(),
      onClose: jest.fn(),
      onDraftNameChange: jest.fn(),
      onConfirm: jest.fn(),
      reset: jest.fn(),
    },
    ledgerSyncActivationDrawer: {
      isOpen: false,
      onClose: jest.fn(),
    },
  };
}

describe("ContactsPageContent", () => {
  it("should render the introduction with the Contacts production labels", () => {
    render(<ContactsPageContent {...createViewModel()} />);

    expect(screen.getByTestId("contacts-screen")).toBeVisible();
    expect(screen.getByText("Sync your wallet to add a contact")).toBeVisible();
    expect(
      screen.getByText(
        "Contacts are end-to-end encrypted and synced across Ledger Wallet on all your phones and computers.",
      ),
    ).toBeVisible();
    expect(screen.getByRole("button", { name: "Sync my wallet" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Not now" })).toBeEnabled();
  });

  it("should keep the introduction open when activating Ledger Sync", async () => {
    const onActivate = jest.fn();
    const onDismiss = jest.fn();
    const { user } = render(
      <ContactsPageContent {...createViewModel({ onActivate, onDismiss })} />,
    );

    await user.press(screen.getByRole("button", { name: "Sync my wallet" }));

    expect(onActivate).toHaveBeenCalledTimes(1);
    expect(onDismiss).not.toHaveBeenCalled();
    expect(screen.getByText("Sync your wallet to add a contact")).toBeVisible();
  });

  it("should dismiss the introduction from the secondary action", async () => {
    const onDismiss = jest.fn();
    const { user } = render(<ContactsPageContent {...createViewModel({ onDismiss })} />);

    await user.press(screen.getByRole("button", { name: "Not now" }));

    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it("should render the introduction when the status returns to inactive", () => {
    const { rerender } = render(
      <ContactsPageContent
        {...createViewModel({ ledgerSyncStatus: "inactive", isIntroductionOpen: false })}
      />,
    );

    expect(screen.queryByText("Sync your wallet to add a contact")).toBeNull();

    rerender(
      <ContactsPageContent
        {...createViewModel({ ledgerSyncStatus: "ready", isIntroductionOpen: false })}
      />,
    );
    rerender(<ContactsPageContent {...createViewModel({ ledgerSyncStatus: "inactive" })} />);

    expect(screen.getByText("Sync your wallet to add a contact")).toBeVisible();
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

    expect(screen.queryByText("Sync your wallet to add a contact")).toBeNull();
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

    expect(screen.getByText("Sync your wallet to add a contact")).toBeVisible();
  });
});
