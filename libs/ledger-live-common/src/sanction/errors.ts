export class UserAddressSanctionedError extends Error {
  private sanctionedAddress?: string;
  private links = ["https://support.ledger.com/article/Why-Ledger-Complies-with-Sanctions"]; // needed for mobile
  constructor(sanctionedAddress?: string) {
    super();
    this.message = this.constructor.name;
    this.name = this.constructor.name;
    this.sanctionedAddress = sanctionedAddress;
  }

  public getSanctionedAddress(): string | undefined {
    return this.sanctionedAddress;
  }
}

export class UserAddressSanctionedOnReceiveError extends Error {
  private sanctionedAddress?: string;
  constructor(sanctionedAddress?: string) {
    super();
    this.message = this.constructor.name;
    this.name = this.constructor.name;
    this.sanctionedAddress = sanctionedAddress;
  }
}

export class UserAddressSanctionedForStakingError extends Error {
  constructor() {
    super();
    this.message = this.constructor.name;
    this.name = this.constructor.name;
  }
}

export class RecipientAddressSanctionedError extends Error {
  private sanctionedAddress?: string;
  private links = ["https://support.ledger.com/article/Why-Ledger-Complies-with-Sanctions"]; // needed for mobile
  constructor(sanctionedAddress?: string) {
    super();
    this.message = this.constructor.name;
    this.name = this.constructor.name;
    this.sanctionedAddress = sanctionedAddress;
  }
}
