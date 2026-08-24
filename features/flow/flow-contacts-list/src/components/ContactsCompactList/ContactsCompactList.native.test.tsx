import React from "react";
import { render, screen, userEvent } from "@testing-library/react-native";
import {
  mockContact,
  mockContactAddress,
  mockContactWithAddress,
  mockContactWithMultipleAddresses,
} from "@domain/entity-contact/schema.mock";
import type { Contact } from "@domain/entity-contact";
import { ContactsCompactList } from "../../index";

const labels = {
  emptyAddress: "No saved addresses",
  formatAddressCount: (count: number) => `${count} saved addresses`,
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
      <ContactsCompactList
        contacts={createContacts()}
        labels={labels}
        onContactSelect={jest.fn()}
      />,
    );

    expect(screen.getByText("Zero")).toBeVisible();
    expect(screen.getByText(labels.emptyAddress)).toBeVisible();
    expect(screen.getByText("One")).toBeVisible();
    expect(screen.getByText("Main wallet")).toBeVisible();
    expect(screen.getByText("Many")).toBeVisible();
    expect(screen.getByText("2 saved addresses")).toBeVisible();
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
      <ContactsCompactList
        contacts={createContacts()}
        labels={labels}
        maxContacts={2}
        onContactSelect={jest.fn()}
      />,
    );

    expect(screen.getByTestId("contacts-compact-row-contact-zero")).toBeVisible();
    expect(screen.getByTestId("contacts-compact-row-contact-one")).toBeVisible();
    expect(screen.queryByTestId("contacts-compact-row-contact-many")).toBeNull();
  });

  it("should render no rows when contacts are empty or maxContacts is zero", () => {
    const { rerender } = render(
      <ContactsCompactList contacts={[]} labels={labels} onContactSelect={jest.fn()} />,
    );

    expect(screen.queryByTestId("contacts-compact-row-contact-zero")).toBeNull();

    rerender(
      <ContactsCompactList
        contacts={createContacts()}
        labels={labels}
        maxContacts={0}
        onContactSelect={jest.fn()}
      />,
    );

    expect(screen.queryByTestId("contacts-compact-row-contact-zero")).toBeNull();
  });

  it("should provide the selected contact to the consumer callback", async () => {
    const contacts = createContacts();
    const onContactSelect = jest.fn();
    const user = userEvent.setup();

    render(
      <ContactsCompactList contacts={contacts} labels={labels} onContactSelect={onContactSelect} />,
    );

    await user.press(screen.getByTestId("contacts-compact-row-contact-one"));

    expect(onContactSelect).toHaveBeenCalledWith(contacts[1]);
  });
});
