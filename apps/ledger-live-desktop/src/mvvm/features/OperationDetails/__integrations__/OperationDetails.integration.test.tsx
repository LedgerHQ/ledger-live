import React from "react";
import { TFunction } from "i18next";
import { render, screen, withFlagOverrides } from "tests/testSetup";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import {
  mockContact,
  mockContactAddress,
  mockDeviceContactGroupCredentials,
} from "@domain/entity-contact/schema.mock";
import { importLLDCoinFamily } from "~/renderer/families";
import { DataList } from "~/renderer/drawers/OperationDetails";

const ethereum = getCryptoCurrencyById("ethereum");
const contactAddress = "0x1ad23b2cf8d2e0591ea417eb82f7cd9746c53034";
const otherAddress = "0xdeadbeef00000000000000000000000000000000";
const mockT = ((key: string) => key) as TFunction;

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

beforeAll(async () => {
  await importLLDCoinFamily("evm");
});

const renderAddresses = (
  lines: string[],
  contactsEnabled: boolean,
  excludedCurrencyIds: string[] = [],
) =>
  render(<DataList lines={lines} t={mockT} cryptoCurrency={ethereum} />, {
    initialState: {
      contacts: { contacts: [alice] },
      ...withFlagOverrides({
        lwdContacts: {
          enabled: contactsEnabled,
          params: { newBadge: false, excludedCurrencyIds },
        },
      }),
    },
  });

describe("operation details contact address", () => {
  it("should show the contact above the raw address when the address is in the contact list", () => {
    const { container } = renderAddresses([contactAddress], true);

    expect(screen.getByTestId("operation-details-contact")).toBeVisible();
    expect(screen.getByText("Alice")).toBeVisible();
    expect(container).toHaveTextContent(contactAddress);
  });

  it("should keep the raw address when it is not in the contact list", () => {
    const { container } = renderAddresses([otherAddress], true);

    expect(screen.queryByTestId("operation-details-contact")).not.toBeInTheDocument();
    expect(container).toHaveTextContent(otherAddress);
  });

  it("should keep only the raw address when lwdContacts is disabled", () => {
    const { container } = renderAddresses([contactAddress], false);

    expect(screen.queryByTestId("operation-details-contact")).not.toBeInTheDocument();
    expect(container).toHaveTextContent(contactAddress);
  });

  it("should keep only the raw address when the currency is excluded from contacts", () => {
    const { container } = renderAddresses([contactAddress], true, ["ethereum"]);

    expect(screen.queryByTestId("operation-details-contact")).not.toBeInTheDocument();
    expect(container).toHaveTextContent(contactAddress);
  });
});
