import { renderHook } from "tests/testSetup";
import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import {
  mockContact,
  mockContactAddress,
  mockDeviceContactGroupCredentials,
} from "@domain/entity-contact/schema.mock";
import { useAddressDisplay } from "../useAddressDisplay";

const ethCurrency = getCryptoCurrencyById("ethereum");
const ethAccount = genAccount("eth-addr-display", { currency: ethCurrency });

const stateWithAccount = { accounts: [ethAccount] };

const contactAddress = "0x1ad23b2cf8d2e0591ea417eb82f7cd9746c53034";
const benWithUsdtAddress = mockContact({
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

const stateWithContact = { contacts: { contacts: [benWithUsdtAddress] } };

describe("useAddressDisplay", () => {
  it("should return empty result for empty address", () => {
    const { result } = renderHook(() => useAddressDisplay("", "ethereum"), {
      initialState: stateWithAccount,
    });

    expect(result.current.displayName).toBe("");
    expect(result.current.matchingAccount).toBeUndefined();
  });

  it("should truncate address when no account match", () => {
    const addr = "0x1234567890abcdef1234567890abcdef12345678";

    const { result } = renderHook(() => useAddressDisplay(addr, "ethereum"), {
      initialState: stateWithAccount,
    });

    expect(result.current.displayName).toBe("0x1234...5678");
    expect(result.current.matchingAccount).toBeUndefined();
  });

  it("should match own account by freshAddress", () => {
    const { result } = renderHook(() => useAddressDisplay(ethAccount.freshAddress, "ethereum"), {
      initialState: stateWithAccount,
    });

    expect(result.current.matchingAccount).toBeDefined();
    expect(result.current.matchingAccount?.id).toBe(ethAccount.id);
  });

  it("should match freshAddress case-insensitively", () => {
    const { result } = renderHook(
      () => useAddressDisplay(ethAccount.freshAddress.toUpperCase(), "ethereum"),
      { initialState: stateWithAccount },
    );

    expect(result.current.matchingAccount?.id).toBe(ethAccount.id);
  });

  it("should not match account with different currencyId", () => {
    const { result } = renderHook(() => useAddressDisplay(ethAccount.freshAddress, "bitcoin"), {
      initialState: stateWithAccount,
    });

    expect(result.current.matchingAccount).toBeUndefined();
  });

  it("should display the contact name instead of the address", () => {
    const { result } = renderHook(() => useAddressDisplay(contactAddress, "ethereum"), {
      initialState: stateWithContact,
    });

    expect(result.current.displayName).toBe("Ben");
    expect(result.current.contactName).toBe("Ben");
  });

  it("should return the label of the contact address matched on the same network", () => {
    const { result } = renderHook(() => useAddressDisplay(contactAddress, "ethereum"), {
      initialState: stateWithContact,
    });

    expect(result.current.contactAddressLabel).toBe("USDT Coinbase");
  });

  it("should ignore contacts when includeContacts is false", () => {
    const { result } = renderHook(
      () => useAddressDisplay(contactAddress, "ethereum", { includeContacts: false }),
      { initialState: stateWithContact },
    );

    expect(result.current.contactName).toBeUndefined();
    expect(result.current.contactAddressLabel).toBeUndefined();
    expect(result.current.displayName).toBe("0x1ad2...3034");
  });

  it("should not match a contact address on another network", () => {
    const { result } = renderHook(() => useAddressDisplay(contactAddress, "polygon"), {
      initialState: stateWithContact,
    });

    expect(result.current.contactName).toBeUndefined();
    expect(result.current.displayName).toBe("0x1ad2...3034");
  });

  it("should prefer the account name over the contact name for an own address", () => {
    const { result } = renderHook(() => useAddressDisplay(ethAccount.freshAddress, "ethereum"), {
      initialState: {
        ...stateWithAccount,
        contacts: {
          contacts: [
            mockContact({
              id: "contact-me",
              name: "Ben",
              addresses: [
                mockContactAddress({ currencyId: "ethereum", address: ethAccount.freshAddress }),
              ],
              deviceCredentials: mockDeviceContactGroupCredentials(),
            }),
          ],
        },
      },
    });

    expect(result.current.displayName).toBe(result.current.accountName);
    expect(result.current.contactName).toBe("Ben");
  });
});
