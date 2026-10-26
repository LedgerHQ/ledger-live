import type { SolanaAddressBook } from "@ledgerhq/device-signer-kit-solana";
import { solanaAddressBookProvider } from "../src/addressBook/solanaAddressBookProvider";

const addressBook: SolanaAddressBook = { contactGroups: [], ledgerAccounts: [] };

describe("solanaAddressBookProvider", () => {
  afterEach(() => {
    solanaAddressBookProvider.clearSource();
  });

  it("has no address book until a host registers a source", () => {
    expect(solanaAddressBookProvider.getAddressBook()).toBeUndefined();
  });

  it("reads the registered source on every call", () => {
    const source = jest.fn(() => addressBook);
    solanaAddressBookProvider.setSource(source);

    expect(solanaAddressBookProvider.getAddressBook()).toBe(addressBook);
    expect(solanaAddressBookProvider.getAddressBook()).toBe(addressBook);
    expect(source).toHaveBeenCalledTimes(2);
  });

  it("degrades to no address book when the source throws, so signing is never broken", () => {
    solanaAddressBookProvider.setSource(() => {
      throw new Error("contacts slice is not mounted");
    });

    expect(solanaAddressBookProvider.getAddressBook()).toBeUndefined();
  });

  it("stops reading a cleared source", () => {
    solanaAddressBookProvider.setSource(() => addressBook);
    solanaAddressBookProvider.clearSource();

    expect(solanaAddressBookProvider.getAddressBook()).toBeUndefined();
  });
});
