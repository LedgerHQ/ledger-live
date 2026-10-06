import React from "react";
import { render, screen, withFlagOverrides } from "tests/testSetup";
import type { Operation } from "@ledgerhq/types-live";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import {
  mockContact,
  mockContactAddress,
  mockDeviceContactGroupCredentials,
} from "@domain/entity-contact/schema.mock";
import AddressCell from "../AddressCell";

jest.mock("~/renderer/families", () => ({
  useLLDCoinFamily: () => ({}),
}));

const ethereumCurrency = getCryptoCurrencyById("ethereum");
const contactAddress = "0x1ad23b2cf8d2e0591ea417eb82f7cd9746c53034";
const unknownAddress = "0xdeadbeef00000000000000000000000000000000";

const ben = mockContact({
  id: "contact-ben",
  name: "Ben",
  addresses: [
    mockContactAddress({
      id: "address-usdt",
      currencyId: "ethereum/erc20/tether_usd",
      label: "USDT Coinbase",
      address: contactAddress,
    }),
  ],
  deviceCredentials: mockDeviceContactGroupCredentials(),
});

const makeOperation = (overrides: Partial<Operation> = {}): Operation =>
  ({
    id: "op-1",
    type: "OUT",
    senders: ["0x0000000000000000000000000000000000000001"],
    recipients: [contactAddress],
    hasFailed: false,
    date: new Date("2026-01-01T10:00:00Z"),
    ...overrides,
  }) as Operation;

const renderCell = (operation: Operation, payTabEnabled = true) =>
  render(<AddressCell operation={operation} currency={ethereumCurrency} />, {
    initialState: {
      contacts: { contacts: [ben] },
      ...withFlagOverrides({ lwdPayTab: { enabled: payTabEnabled } }),
    },
  });

describe("OperationsList/AddressCell", () => {
  it("shows the contact name and address label for a recipient saved as a contact", async () => {
    renderCell(makeOperation());

    expect(await screen.findByText("Ben")).toBeInTheDocument();
    expect(screen.getByText("USDT Coinbase")).toBeInTheDocument();
  });

  it("resolves the sender for incoming operations", async () => {
    renderCell(makeOperation({ type: "IN", senders: [contactAddress], recipients: [] }));

    expect(await screen.findByText("Ben")).toBeInTheDocument();
  });

  it("keeps the raw address when it belongs to no contact", async () => {
    renderCell(makeOperation({ recipients: [unknownAddress] }));

    expect(await screen.findByText(unknownAddress.slice(0, 14))).toBeInTheDocument();
    expect(screen.queryByTestId("operation-address-contact")).not.toBeInTheDocument();
  });

  it("keeps the raw address when the lwdPayTab flag is disabled", async () => {
    renderCell(makeOperation(), false);

    expect(await screen.findByText(contactAddress.slice(0, 14))).toBeInTheDocument();
    expect(screen.queryByText("Ben")).not.toBeInTheDocument();
    expect(screen.queryByText("USDT Coinbase")).not.toBeInTheDocument();
  });
});
