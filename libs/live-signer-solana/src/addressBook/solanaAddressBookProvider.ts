import { AddressBookProvider, type AddressBookSource } from "@ledgerhq/live-dmk-shared";
import type { SolanaAddressBook } from "@ledgerhq/device-signer-kit-solana";

/**
 * Injection seam for the Solana address book the Solana signer clear-signs
 * against. See {@link AddressBookProvider}: the app composition root registers a
 * source that builds the snapshot from the Contacts domain, which this legacy
 * package must not import.
 */
export type SolanaAddressBookSource = AddressBookSource<SolanaAddressBook>;

export const solanaAddressBookProvider = new AddressBookProvider<SolanaAddressBook>();
