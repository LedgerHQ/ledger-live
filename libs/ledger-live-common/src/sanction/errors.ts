export class UserAddressSanctionedError extends Error {
  constructor() {
    super();
    this.message = this.constructor.name;
    this.name = this.constructor.name;
  }
}

export class UserAddressSanctionedForSendError extends Error {
  constructor() {
    super();
    this.message = this.constructor.name;
    this.name = this.constructor.name;
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
  constructor() {
    super();
    this.message = this.constructor.name;
    this.name = this.constructor.name;
  }
}
