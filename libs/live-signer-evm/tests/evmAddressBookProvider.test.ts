import type { EvmAddressBook } from "@ledgerhq/device-signer-kit-ethereum";
import { evmAddressBookProvider } from "../src/addressBook/evmAddressBookProvider";

const addressBook: EvmAddressBook = { contactGroups: [], ledgerAccounts: [] };

describe("evmAddressBookProvider", () => {
  afterEach(() => {
    evmAddressBookProvider.clearSource();
  });

  it("has no address book until a host registers a source", () => {
    expect(evmAddressBookProvider.getAddressBook()).toBeUndefined();
  });

  it("reads the registered source on every call", () => {
    const source = jest.fn(() => addressBook);
    evmAddressBookProvider.setSource(source);

    expect(evmAddressBookProvider.getAddressBook()).toBe(addressBook);
    expect(evmAddressBookProvider.getAddressBook()).toBe(addressBook);
    expect(source).toHaveBeenCalledTimes(2);
  });

  it("replaces a previously registered source", () => {
    evmAddressBookProvider.setSource(() => addressBook);
    evmAddressBookProvider.setSource(() => undefined);

    expect(evmAddressBookProvider.getAddressBook()).toBeUndefined();
  });

  it("degrades to no address book when the source throws, so signing is never broken", () => {
    evmAddressBookProvider.setSource(() => {
      throw new Error("contacts slice is not mounted");
    });

    expect(evmAddressBookProvider.getAddressBook()).toBeUndefined();
  });

  it("stops reading a cleared source", () => {
    evmAddressBookProvider.setSource(() => addressBook);
    evmAddressBookProvider.clearSource();

    expect(evmAddressBookProvider.getAddressBook()).toBeUndefined();
  });
});
