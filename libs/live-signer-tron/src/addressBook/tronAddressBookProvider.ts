import { AddressBookProvider, type AddressBookSource } from "@ledgerhq/live-dmk-shared";
import type { TronAddressBook } from "@ledgerhq/device-signer-kit-tron";

/**
 * Injection seam for the Tron address book the Tron signer clear-signs against.
 * See {@link AddressBookProvider}: the app composition root registers a source
 * that builds the snapshot from the Contacts domain, which this legacy package
 * must not import.
 */
export type TronAddressBookSource = AddressBookSource<TronAddressBook>;

export const tronAddressBookProvider = new AddressBookProvider<TronAddressBook>();
