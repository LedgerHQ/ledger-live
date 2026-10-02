/**
 * Injection seam for the address-book snapshot a DMK signer clear-signs
 * against, generic over the per-family book type.
 *
 * Building the snapshot needs the Contacts domain, which the legacy signer
 * packages must not import, so the app composition root registers a source
 * instead. It is a thunk because the store does not exist when the signer
 * module loads.
 *
 * Each signer family owns exactly one instance of this class (EVM, Tron, ...),
 * typed to its own book. The signer calls `getAddressBook` once per instance:
 * within one signing flow the recipient and the signing account are matched
 * against the same snapshot.
 */
export type AddressBookSource<TAddressBook> = () => TAddressBook | undefined;

export class AddressBookProvider<TAddressBook> {
  private source: AddressBookSource<TAddressBook> | null = null;

  setSource(source: AddressBookSource<TAddressBook>) {
    this.source = source;
  }

  clearSource() {
    this.source = null;
  }

  /**
   * Never throws: a host that registered no source, or whose source fails,
   * must lose contact names rather than the ability to sign.
   */
  getAddressBook(): TAddressBook | undefined {
    if (!this.source) return undefined;

    try {
      return this.source();
    } catch {
      return undefined;
    }
  }
}
