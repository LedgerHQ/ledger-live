import { createCustomErrorClass } from "@ledgerhq/errors";

export const AddressesSanctionedError = createCustomErrorClass<{ addresses: string[] }>(
  "AddressesSanctionedError",
);

export class UserAddressSanctionedError extends Error {
  private sanctionedAddresses: string[];
  private links = ["https://support.ledger.com/article/Why-Ledger-Complies-with-Sanctions"]; // needed for mobile
  constructor(...sanctionedAddresses: string[]) {
    super();
    this.message = this.constructor.name;
    this.name = this.constructor.name;
    this.sanctionedAddresses = [...sanctionedAddresses];
  }

  public getSanctionedAddress(): string[] {
    return this.sanctionedAddresses;
  }
}

export class UserUtxoAddressSanctionedError extends Error {
  private sanctionedAddresses: string[];
  private links = ["https://support.ledger.com/article/Why-Ledger-Complies-with-Sanctions"]; // needed for mobile
  constructor(...sanctionedAddresses: string[]) {
    super();
    this.message = this.constructor.name;
    this.name = this.constructor.name;
    this.sanctionedAddresses = [...sanctionedAddresses];
  }

  public getSanctionedAddress(): string[] {
    return this.sanctionedAddresses;
  }
}

export class UserAddressSanctionedOnReceiveError extends Error {
  private sanctionedAddress: string | undefined;
  constructor(sanctionedAddress?: string | undefined) {
    super();
    this.message = this.constructor.name;
    this.name = this.constructor.name;
    this.sanctionedAddress = sanctionedAddress;
  }
}

export class RecipientAddressSanctionedError extends Error {
  private sanctionedAddresses: string[];
  private links = ["https://support.ledger.com/article/Why-Ledger-Complies-with-Sanctions"]; // needed for mobile
  constructor(...sanctionedAddresses: string[]) {
    super();
    this.message = this.constructor.name;
    this.name = this.constructor.name;
    this.sanctionedAddresses = [...sanctionedAddresses];
  }
}
