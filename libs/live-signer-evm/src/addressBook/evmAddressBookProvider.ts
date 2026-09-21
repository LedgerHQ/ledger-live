import { AddressBookProvider, type AddressBookSource } from "@ledgerhq/live-dmk-shared";
import type { EvmAddressBook } from "@ledgerhq/device-signer-kit-ethereum";

/**
 * Injection seam for the EVM address book the Ethereum signer clear-signs
 * against. See {@link AddressBookProvider}: the app composition root registers
 * a source that builds the snapshot from the Contacts domain, which this
 * legacy package must not import.
 */
export type EvmAddressBookSource = AddressBookSource<EvmAddressBook>;

export const evmAddressBookProvider = new AddressBookProvider<EvmAddressBook>();
