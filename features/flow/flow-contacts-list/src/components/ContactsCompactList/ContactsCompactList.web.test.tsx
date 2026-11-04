import React from "react";
import { fireEvent, render as renderWithoutI18n, screen } from "@testing-library/react";
import { ContactsI18nTestProvider } from "@features/platform-contacts/testing";
import {
  mockContact,
  mockContactAddress,
  mockContactWithAddress,
  mockContactWithMultipleAddresses,
} from "@domain/entity-contact/schema.mock";
import type { Contact } from "@domain/entity-contact";
import { ContactsCompactList } from "../../index";

const render = (ui: React.ReactElement) =>
  renderWithoutI18n(ui, { wrapper: ContactsI18nTestProvider });

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

    render(<ContactsCompactList contacts={contacts} onSelectContact={jest.fn()} />);

    const [zeroRow, oneRow, manyRow] = screen.getAllByTestId(/^contacts-compact-row-/);

    expect(zeroRow).toHaveTextContent("Zero");
    expect(zeroRow).toHaveTextContent("contacts.addressCount");
    expect(oneRow).toHaveTextContent("One");
    expect(oneRow).toHaveTextContent("Main wallet");
    expect(manyRow).toHaveTextContent("Many");
    expect(manyRow).toHaveTextContent("contacts.addressCount");
    expect(zeroRow.compareDocumentPosition(oneRow)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    expect(oneRow.compareDocumentPosition(manyRow)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    expect(screen.getByTestId("contacts-avatar-contact-zero")).toBeVisible();
  });

  it("should render only the first supplied contacts when maxContacts is set", () => {
    const contacts = createContacts();

    render(<ContactsCompactList contacts={contacts} maxContacts={2} onSelectContact={jest.fn()} />);

    expect(screen.getAllByTestId(/^contacts-compact-row-/)).toHaveLength(2);
    expect(screen.getByTestId("contacts-compact-row-contact-zero")).toBeVisible();
    expect(screen.getByTestId("contacts-compact-row-contact-one")).toBeVisible();
    expect(screen.queryByTestId("contacts-compact-row-contact-many")).not.toBeInTheDocument();
  });

  it("should render no rows when contacts are empty or maxContacts is zero", () => {
    const { rerender } = render(<ContactsCompactList contacts={[]} onSelectContact={jest.fn()} />);

    expect(screen.getByTestId("contacts-compact-list")).toBeEmptyDOMElement();

    rerender(
      <ContactsCompactList
        contacts={createContacts()}
        maxContacts={0}
        onSelectContact={jest.fn()}
      />,
    );

    expect(screen.getByTestId("contacts-compact-list")).toBeEmptyDOMElement();
  });

  it("should provide the selected contact to the consumer callback", async () => {
    const contacts = createContacts();
    const onSelectContact = jest.fn();

    render(<ContactsCompactList contacts={contacts} onSelectContact={onSelectContact} />);

    fireEvent.click(screen.getByTestId("contacts-compact-row-contact-one"));

    expect(onSelectContact).toHaveBeenCalledWith(contacts[1]);
  });
});
