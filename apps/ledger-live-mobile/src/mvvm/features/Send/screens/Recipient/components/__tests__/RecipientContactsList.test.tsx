import {
  mockContact,
  mockContactAddress,
  mockContactWithMultipleAddresses,
} from "@domain/entity-contact/schema.mock";
import React from "react";
import { render, screen } from "@tests/test-renderer";
import { RecipientContactsList } from "../RecipientContactsList";

describe("RecipientContactsList", () => {
  it("should render contacts with their network-filtered address descriptions", async () => {
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

    await user.press(screen.getByTestId("contacts-compact-row-contact-multiple"));
    expect(onContactSelect).toHaveBeenCalledWith(multipleAddressContact);
  });
});
