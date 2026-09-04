import { renderHook, withFlagOverrides } from "tests/testSetup";
import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import {
  mockContact,
  mockContactAddress,
  mockDeviceContactGroupCredentials,
} from "@domain/entity-contact/schema.mock";
import { useOperationCounterpartyCellViewModel } from "../useOperationCounterpartyCellViewModel";
import type { OperationTableItem } from "../../../types";

const ethereumCurrency = getCryptoCurrencyById("ethereum");
const account = genAccount("history-counterparty", { currency: ethereumCurrency });

const contactAddress = "0x1ad23b2cf8d2e0591ea417eb82f7cd9746c53034";
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

const makeItem = (address: string): OperationTableItem =>
  ({
    id: "item-1",
    account,
    address,
    currency: ethereumCurrency,
    type: "OUT",
  }) as unknown as OperationTableItem;

const renderViewModel = (address: string, payTabEnabled = true) =>
  renderHook(() => useOperationCounterpartyCellViewModel(makeItem(address)), {
    initialState: {
      accounts: [account],
      contacts: { contacts: [ben] },
      ...withFlagOverrides({ lwdPayTab: { enabled: payTabEnabled } }),
    },
  });

describe("useOperationCounterpartyCellViewModel", () => {
  it("should name the counterparty after the contact owning the address", () => {
    const { result } = renderViewModel(contactAddress);

    expect(result.current.displayName).toBe("Ben");
  });

  it("should expose the label of the contact address the transfer used", () => {
    const { result } = renderViewModel(contactAddress);

    expect(result.current.contactAddressLabel).toBe("USDT Coinbase");
  });

  it("should truncate an address that belongs to no contact", () => {
    const { result } = renderViewModel("0xdeadbeef00000000000000000000000000000000");

    expect(result.current.displayName).toBe("0xdead...0000");
    expect(result.current.contactAddressLabel).toBeUndefined();
  });

  it("should ignore contact resolution when the lwdPayTab flag is disabled", () => {
    const { result } = renderViewModel(contactAddress, false);

    expect(result.current.displayName).toBe("0x1ad2...3034");
    expect(result.current.contactAddressLabel).toBeUndefined();
  });
});
