import React from "react";
import { render, screen, withFlagOverrides } from "@tests/test-renderer";
import {
  mockContact,
  mockContactAddress,
  mockDeviceContactGroupCredentials,
} from "@domain/entity-contact/schema.mock";
import DataList from "./DataList";

const contactAddress = "0x1ad23b2cf8d2e0591ea417eb82f7cd9746c53034";
const otherAddress = "0xdeadbeef00000000000000000000000000000000";

const alice = mockContact({
  id: "contact-alice",
  name: "Alice",
  addresses: [
    mockContactAddress({
      id: "address-alice",
      currencyId: "ethereum",
      label: "Ethereum",
      address: contactAddress,
    }),
  ],
  deviceCredentials: mockDeviceContactGroupCredentials(),
});

const renderAddresses = (lines: string[], contactsEnabled: boolean) =>
  render(<DataList data={lines} currencyId="ethereum" testID="operationDetails-recipient" />, {
    overrideInitialState: withFlagOverrides(
      { lwmContacts: { enabled: contactsEnabled, params: { newBadge: false } } },
      state => ({ ...state, contacts: { ...state.contacts, contacts: [alice] } }),
    ),
  });

describe("OperationDetails DataList contact", () => {
  it("should show the contact above the raw address when the address is in the contact list", () => {
    renderAddresses([contactAddress], true);

    expect(screen.getByTestId("operation-details-contact")).toBeVisible();
    expect(screen.getByText("Alice")).toBeVisible();
    expect(screen.getByText(contactAddress)).toBeVisible();
  });

  it("should keep only the raw address when it is not in the contact list", () => {
    renderAddresses([otherAddress], true);

    expect(screen.queryByTestId("operation-details-contact")).toBeNull();
    expect(screen.getByText(otherAddress)).toBeVisible();
  });

  it("should keep only the raw address when lwmContacts is disabled", () => {
    renderAddresses([contactAddress], false);

    expect(screen.queryByTestId("operation-details-contact")).toBeNull();
    expect(screen.getByText(contactAddress)).toBeVisible();
  });
});
