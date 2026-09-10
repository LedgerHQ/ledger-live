import React from "react";
import { render, screen, userEvent } from "@testing-library/react-native";
import {
  mockContact,
  mockContactAddress,
  mockContactWithAddress,
  mockContactWithMultipleAddresses,
} from "@domain/entity-contact/schema.mock";
import type { Contact } from "@domain/entity-contact";
import { I18nTestProvider, type I18nTestProviderProps } from "@shared/i18n/testing";
import { ContactsCompactList } from "../../index.native";

const resources: I18nTestProviderProps["resources"] = {
  en: {
    translation: {
      contacts: {
        addressCount_zero: "0 address",
        addressCount_one: "{{count}} address",
        addressCount_other: "{{count}} addresses",
      },
    },
  },
};

function createContacts(): readonly Contact[] {
  return [
    mockContact({ id: "contact-zero", name: "Zero" }),
    mockContactWithAddress({
      id: "contact-one",
      name: "One",
      addresses: [mockContactAddress({ id: "address-one", label: "Main wallet" })],
    }),
    mockContactWithMultipleAddresses({ id: "contact-many", name: "Many" }),
  ];
}

describe("ContactsCompactList", () => {
  it("should render supplied contacts with the appropriate address descriptions", () => {
    render(
      <I18nTestProvider resources={resources}>
        <ContactsCompactList contacts={createContacts()} onContactSelect={jest.fn()} />
      </I18nTestProvider>,
    );

    expect(screen.getByText("Zero")).toBeVisible();
    expect(screen.getByText("0 address")).toBeVisible();
    expect(screen.getByText("One")).toBeVisible();
    expect(screen.getByText("Main wallet")).toBeVisible();
    expect(screen.getByText("Many")).toBeVisible();
    expect(screen.getByText("2 addresses")).toBeVisible();
    expect(screen.getByTestId("contacts-avatar-contact-zero").props.size).toBe("md");
    expect(screen.getByTestId("contacts-compact-row-contact-zero").props.lx).toEqual({
      marginHorizontal: "-s8",
    });
    expect(screen.getAllByTestId(/^contacts-compact-row-/).map(row => row.props.testID)).toEqual([
      "contacts-compact-row-contact-zero",
      "contacts-compact-row-contact-one",
      "contacts-compact-row-contact-many",
    ]);
  });

  it("should render only the first supplied contacts when maxContacts is set", () => {
    render(
      <I18nTestProvider resources={resources}>
        <ContactsCompactList
          contacts={createContacts()}
          maxContacts={2}
          onContactSelect={jest.fn()}
        />
      </I18nTestProvider>,
    );

    expect(screen.getByTestId("contacts-compact-row-contact-zero")).toBeVisible();
    expect(screen.getByTestId("contacts-compact-row-contact-one")).toBeVisible();
    expect(screen.queryByTestId("contacts-compact-row-contact-many")).toBeNull();
  });

  it("should render no rows when contacts are empty or maxContacts is zero", () => {
    const { rerender } = render(
      <I18nTestProvider resources={resources}>
        <ContactsCompactList contacts={[]} onContactSelect={jest.fn()} />
      </I18nTestProvider>,
    );

    expect(screen.queryByTestId("contacts-compact-row-contact-zero")).toBeNull();

    rerender(
      <I18nTestProvider resources={resources}>
        <ContactsCompactList
          contacts={createContacts()}
          maxContacts={0}
          onContactSelect={jest.fn()}
        />
      </I18nTestProvider>,
    );

    expect(screen.queryByTestId("contacts-compact-row-contact-zero")).toBeNull();
  });

  it("should provide the selected contact to the consumer callback", async () => {
    const contacts = createContacts();
    const onContactSelect = jest.fn();
    const user = userEvent.setup();

    render(
      <I18nTestProvider resources={resources}>
        <ContactsCompactList contacts={contacts} onContactSelect={onContactSelect} />
      </I18nTestProvider>,
    );

    await user.press(screen.getByTestId("contacts-compact-row-contact-one"));

    expect(onContactSelect).toHaveBeenCalledWith(contacts[1]);
  });
});
