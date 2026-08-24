import {
  mockContact,
  mockContactAddress,
  mockContactWithMultipleAddresses,
} from "@domain/entity-contact/schema.mock";
import React from "react";
import { render, screen } from "tests/testSetup";
import { RecipientContactsList } from "../RecipientContactsList";

describe("RecipientContactsList", () => {
  it("renders the contact section with network-filtered address descriptions", async () => {
    const singleAddressContact = mockContact({
      id: "contact-single",
      name: "Vincent",
      addresses: [mockContactAddress({ label: "Ethereum Main" })],
    });
    const multipleAddressContact = mockContactWithMultipleAddresses({
      id: "contact-multiple",
      name: "Benoit",
    });
    const onContactSelect = jest.fn();
    const { user } = render(
      <RecipientContactsList
        contacts={[singleAddressContact, multipleAddressContact]}
        onContactSelect={onContactSelect}
      />,
    );

    expect(screen.getByText("Contacts")).toBeVisible();
    expect(screen.getByText("Ethereum Main")).toBeVisible();
    expect(screen.getByText("2 addresses")).toBeVisible();

    await user.click(screen.getByTestId("contacts-compact-row-contact-multiple"));
    expect(onContactSelect).toHaveBeenCalledWith(multipleAddressContact);
  });
});
