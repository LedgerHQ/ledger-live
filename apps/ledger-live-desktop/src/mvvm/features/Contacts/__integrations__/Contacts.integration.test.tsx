import React from "react";
import { render, screen, withFlagOverrides } from "tests/testSetup";
import { useContactsEntryConfig } from "LLD/features/Contacts";

const ContactsEntryGateProbe = () => {
  const { isEnabled, showNewBadge } = useContactsEntryConfig();

  if (!isEnabled) {
    return null;
  }

  return (
    <div data-testid="contacts-entry">
      {showNewBadge ? <span data-testid="contacts-entry-new-badge">New</span> : null}
    </div>
  );
};

describe("Contacts integration", () => {
  it("should not render the Contacts entry when lwdContacts is disabled", () => {
    render(<ContactsEntryGateProbe />, {
      initialState: withFlagOverrides({
        lwdContacts: { enabled: false, params: { newBadge: false } },
      }),
    });

    expect(screen.queryByTestId("contacts-entry")).not.toBeInTheDocument();
  });

  it("should render the Contacts entry without a New badge when enabled and newBadge is false", () => {
    render(<ContactsEntryGateProbe />, {
      initialState: withFlagOverrides({
        lwdContacts: { enabled: true, params: { newBadge: false } },
      }),
    });

    expect(screen.getByTestId("contacts-entry")).toBeVisible();
    expect(screen.queryByTestId("contacts-entry-new-badge")).not.toBeInTheDocument();
  });

  it("should render the Contacts entry with a New badge when enabled and newBadge is true", () => {
    render(<ContactsEntryGateProbe />, {
      initialState: withFlagOverrides({
        lwdContacts: { enabled: true, params: { newBadge: true } },
      }),
    });

    expect(screen.getByTestId("contacts-entry")).toBeVisible();
    expect(screen.getByTestId("contacts-entry-new-badge")).toBeVisible();
  });
});
