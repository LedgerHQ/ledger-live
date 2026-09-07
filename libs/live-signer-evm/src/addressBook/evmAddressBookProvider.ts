import type { EvmAddressBook } from "@ledgerhq/device-signer-kit-ethereum";

export type EvmAddressBookSource = () => EvmAddressBook | undefined;

/**
 * Injection seam for the EVM address book the Ethereum signer clear-signs
 * against.
 *
 * Building the snapshot needs the Contacts domain, which this legacy package
 * must not import, so the app composition root registers a source instead. It
 * is a thunk because the store does not exist when this module loads.
 *
 * The signer calls it once per instance: within one signing flow the recipient
 * and the signing account are matched against the same snapshot.
 */
export class EvmAddressBookProvider {
  private static _instance: EvmAddressBookProvider | null = null;

  private source: EvmAddressBookSource | null = null;

  private constructor() {}

  static getInstance(): EvmAddressBookProvider {
    if (!EvmAddressBookProvider._instance) {
      EvmAddressBookProvider._instance = new EvmAddressBookProvider();
    }
    return EvmAddressBookProvider._instance;
  }

  setSource(source: EvmAddressBookSource) {
    this.source = source;
  }

  clearSource() {
    this.source = null;
  }

  /**
   * Never throws: a host that registered no source, or whose source fails,
   * must lose contact names rather than the ability to sign.
   */
  getAddressBook(): EvmAddressBook | undefined {
    if (!this.source) return undefined;

    try {
      return this.source();
    } catch {
      return undefined;
    }
  }
}

export const evmAddressBookProvider = EvmAddressBookProvider.getInstance();
