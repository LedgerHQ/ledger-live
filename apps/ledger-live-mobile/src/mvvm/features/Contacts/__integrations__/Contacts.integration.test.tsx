import React from "react";
import { Text } from "react-native";
import { render, screen, withFlagOverrides } from "@tests/test-renderer";
import { useContactsEntryConfig } from "LLM/features/Contacts";

const ContactsEntryGateProbe = () => {
  const { isEnabled, showNewBadge } = useContactsEntryConfig();

  if (!isEnabled) {
    return null;
  }

  return (
    <>
      <Text testID="contacts-entry">Contacts</Text>
      {showNewBadge ? <Text testID="contacts-entry-new-badge">New</Text> : null}
    </>
  );
};

describe("Contacts integration", () => {
  it("should not render the Contacts entry when lwmContacts is disabled", () => {
    render(<ContactsEntryGateProbe />, {
      overrideInitialState: withFlagOverrides({
        lwmContacts: { enabled: false, params: { newBadge: false } },
      }),
    });

    expect(screen.queryByTestId("contacts-entry")).toBeNull();
  });

  it("should render the Contacts entry without a New badge when enabled and newBadge is false", () => {
    render(<ContactsEntryGateProbe />, {
      overrideInitialState: withFlagOverrides({
        lwmContacts: { enabled: true, params: { newBadge: false } },
      }),
    });

    expect(screen.getByTestId("contacts-entry")).toBeVisible();
    expect(screen.queryByTestId("contacts-entry-new-badge")).toBeNull();
  });

  it("should render the Contacts entry with a New badge when enabled and newBadge is true", () => {
    render(<ContactsEntryGateProbe />, {
      overrideInitialState: withFlagOverrides({
        lwmContacts: { enabled: true, params: { newBadge: true } },
      }),
    });

    expect(screen.getByTestId("contacts-entry")).toBeVisible();
    expect(screen.getByTestId("contacts-entry-new-badge")).toBeVisible();
  });
});
