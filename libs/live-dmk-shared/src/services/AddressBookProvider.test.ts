import { AddressBookProvider } from "./AddressBookProvider";

type FakeBook = { contactGroups: string[]; ledgerAccounts: string[] };

const book: FakeBook = { contactGroups: ["a"], ledgerAccounts: [] };

describe("AddressBookProvider", () => {
  let provider: AddressBookProvider<FakeBook>;

  beforeEach(() => {
    provider = new AddressBookProvider<FakeBook>();
  });

  it("has no address book until a host registers a source", () => {
    expect(provider.getAddressBook()).toBeUndefined();
  });

  it("reads the registered source on every call", () => {
    const source = jest.fn(() => book);
    provider.setSource(source);

    expect(provider.getAddressBook()).toBe(book);
    expect(provider.getAddressBook()).toBe(book);
    expect(source).toHaveBeenCalledTimes(2);
  });

  it("replaces a previously registered source", () => {
    provider.setSource(() => book);
    provider.setSource(() => undefined);

    expect(provider.getAddressBook()).toBeUndefined();
  });

  it("degrades to no address book when the source throws, so signing is never broken", () => {
    provider.setSource(() => {
      throw new Error("contacts slice is not mounted");
    });

    expect(provider.getAddressBook()).toBeUndefined();
  });

  it("stops reading a cleared source", () => {
    provider.setSource(() => book);
    provider.clearSource();

    expect(provider.getAddressBook()).toBeUndefined();
  });
});
