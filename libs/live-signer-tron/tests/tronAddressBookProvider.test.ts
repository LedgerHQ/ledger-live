import type { TronAddressBook } from "@ledgerhq/device-signer-kit-tron";
import { tronAddressBookProvider } from "../src/addressBook/tronAddressBookProvider";

const addressBook: TronAddressBook = { contactGroups: [], ledgerAccounts: [] };

describe("tronAddressBookProvider", () => {
  afterEach(() => {
    tronAddressBookProvider.clearSource();
  });

  it("has no address book until a host registers a source", () => {
    expect(tronAddressBookProvider.getAddressBook()).toBeUndefined();
  });

  it("reads the registered source on every call", () => {
    const source = jest.fn(() => addressBook);
    tronAddressBookProvider.setSource(source);

    expect(tronAddressBookProvider.getAddressBook()).toBe(addressBook);
    expect(tronAddressBookProvider.getAddressBook()).toBe(addressBook);
    expect(source).toHaveBeenCalledTimes(2);
  });

  it("degrades to no address book when the source throws, so signing is never broken", () => {
    tronAddressBookProvider.setSource(() => {
      throw new Error("contacts slice is not mounted");
    });

    expect(tronAddressBookProvider.getAddressBook()).toBeUndefined();
  });

  it("stops reading a cleared source", () => {
    tronAddressBookProvider.setSource(() => addressBook);
    tronAddressBookProvider.clearSource();

    expect(tronAddressBookProvider.getAddressBook()).toBeUndefined();
  });
});
