import React from "react";
import { fireEvent, render, screen } from "@testing-library/react-native";
import { ContactsView } from "./ContactsView";
import type { ContactsViewModel } from "./useContactsViewModel";

jest.mock("@ledgerhq/lumen-ui-rnative", () => {
  const React = require("react");
  const { Pressable, Text, View } = require("react-native");

  return {
    Box: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => (
      <View {...props}>{children}</View>
    ),
    BottomSheetHeader: () => <View testID="contacts-ledger-sync-introduction-header" />,
    BottomSheetView: ({ children }: React.PropsWithChildren) => <View>{children}</View>,
    Button: ({ children, onPress }: React.PropsWithChildren<{ onPress: () => void }>) => (
      <Pressable accessibilityRole="button" onPress={onPress}>
        <Text>{children}</Text>
      </Pressable>
    ),
    Text: ({ children }: React.PropsWithChildren) => <Text>{children}</Text>,
  };
});

jest.mock("@features/flow-contacts", () => {
  const React = require("react");
  const { Text, View } = require("react-native");

  return {
    ContactsPage: ({ ledgerSyncStatus }: { ledgerSyncStatus: string }) => (
      <View testID="contacts-screen">
        <Text>{ledgerSyncStatus}</Text>
      </View>
    ),
  };
});

jest.mock("LLM/components/QueuedDrawer/QueuedDrawerBottomSheet", () => {
  const React = require("react");
  const { Pressable, View } = require("react-native");

  return ({
    children,
    onClose,
    testID,
  }: React.PropsWithChildren<{ onClose: () => void; testID: string }>) => (
    <View testID={testID}>
      <Pressable testID="contacts-ledger-sync-introduction-close" onPress={onClose} />
      <Pressable testID="contacts-ledger-sync-introduction-backdrop" onPress={onClose} />
      <Pressable testID="contacts-ledger-sync-introduction-swipe" onPress={onClose} />
      {children}
    </View>
  );
});

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
  it("renders the inactive introduction with the Figma labels", () => {
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

  it("keeps the introduction open when activating Ledger Sync", () => {
    const onActivate = jest.fn();
    const onDismiss = jest.fn();
    render(<ContactsView {...createViewModel({ onActivate, onDismiss })} />);

    fireEvent.press(screen.getByRole("button", { name: "Turn on Ledger Sync" }));

    expect(onActivate).toHaveBeenCalledTimes(1);
    expect(onDismiss).not.toHaveBeenCalled();
    expect(screen.getByText("Turn on Ledger Sync to save contacts")).toBeVisible();
  });

  it.each([
    ["header close", "contacts-ledger-sync-introduction-close"],
    ["backdrop", "contacts-ledger-sync-introduction-backdrop"],
    ["swipe", "contacts-ledger-sync-introduction-swipe"],
  ])("dismisses the introduction from the %s", (_dismissalPath, testID) => {
    const onDismiss = jest.fn();
    render(<ContactsView {...createViewModel({ onDismiss })} />);

    fireEvent.press(screen.getByTestId(testID));

    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it("dismisses the introduction from the secondary action", () => {
    const onDismiss = jest.fn();
    render(<ContactsView {...createViewModel({ onDismiss })} />);

    fireEvent.press(screen.getByRole("button", { name: "Got it" }));

    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it("reopens the introduction after the status leaves and returns to inactive", () => {
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
