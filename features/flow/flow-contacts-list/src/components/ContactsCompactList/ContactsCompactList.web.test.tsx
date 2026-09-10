import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import {
  mockContact,
  mockContactAddress,
  mockContactWithAddress,
  mockContactWithMultipleAddresses,
} from "@domain/entity-contact/schema.mock";
import type { Contact } from "@domain/entity-contact";
import { I18nTestProvider, type I18nTestProviderProps } from "@shared/i18n/testing";
import { ContactsCompactList } from "../../web";

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
  it("should render supplied contacts in order with the appropriate address descriptions", () => {
    const contacts = createContacts();

    render(
      <I18nTestProvider resources={resources}>
        <ContactsCompactList contacts={contacts} onContactSelect={jest.fn()} />
      </I18nTestProvider>,
    );

    const [zeroRow, oneRow, manyRow] = screen.getAllByTestId(/^contacts-compact-row-/);

    expect(zeroRow).toHaveTextContent("Zero");
    expect(zeroRow).toHaveTextContent("0 address");
    expect(oneRow).toHaveTextContent("One");
    expect(oneRow).toHaveTextContent("Main wallet");
    expect(manyRow).toHaveTextContent("Many");
    expect(manyRow).toHaveTextContent("2 addresses");
    expect(zeroRow.compareDocumentPosition(oneRow)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    expect(oneRow.compareDocumentPosition(manyRow)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    expect(screen.getByTestId("contacts-avatar-contact-zero")).toBeVisible();
  });

  it("should render only the first supplied contacts when maxContacts is set", () => {
    const contacts = createContacts();

    render(
      <I18nTestProvider resources={resources}>
        <ContactsCompactList contacts={contacts} maxContacts={2} onContactSelect={jest.fn()} />
      </I18nTestProvider>,
    );

    expect(screen.getAllByTestId(/^contacts-compact-row-/)).toHaveLength(2);
    expect(screen.getByTestId("contacts-compact-row-contact-zero")).toBeVisible();
    expect(screen.getByTestId("contacts-compact-row-contact-one")).toBeVisible();
    expect(screen.queryByTestId("contacts-compact-row-contact-many")).not.toBeInTheDocument();
  });

  it("should render no rows when contacts are empty or maxContacts is zero", () => {
    const { rerender } = render(
      <I18nTestProvider resources={resources}>
        <ContactsCompactList contacts={[]} onContactSelect={jest.fn()} />
      </I18nTestProvider>,
    );

    expect(screen.getByTestId("contacts-compact-list")).toBeEmptyDOMElement();

    rerender(
      <I18nTestProvider resources={resources}>
        <ContactsCompactList
          contacts={createContacts()}
          maxContacts={0}
          onContactSelect={jest.fn()}
        />
      </I18nTestProvider>,
    );

    expect(screen.getByTestId("contacts-compact-list")).toBeEmptyDOMElement();
  });

  it("should provide the selected contact to the consumer callback", async () => {
    const contacts = createContacts();
    const onContactSelect = jest.fn();

    render(
      <I18nTestProvider resources={resources}>
        <ContactsCompactList contacts={contacts} onContactSelect={onContactSelect} />
      </I18nTestProvider>,
    );

    fireEvent.click(screen.getByTestId("contacts-compact-row-contact-one"));

    expect(onContactSelect).toHaveBeenCalledWith(contacts[1]);
  });
});
