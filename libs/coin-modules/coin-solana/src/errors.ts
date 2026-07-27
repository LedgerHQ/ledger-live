export class SolanaAccountNotFunded extends Error {
  override name = "SolanaAccountNotFunded";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message || "SolanaAccountNotFunded");
    if (fields) Object.assign(this, fields);
  }
}

export class SolanaRecipientAccountNotFunded extends Error {
  override name = "SolanaRecipientAccountNotFunded";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message || "SolanaRecipientAccountNotFunded");
    if (fields) Object.assign(this, fields);
  }
}

export class SolanaRecipientAssociatedTokenAccountWillBeFunded extends Error {
  override name = "SolanaAssociatedTokenAccountWillBeFunded";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message || "SolanaAssociatedTokenAccountWillBeFunded");
    if (fields) Object.assign(this, fields);
  }
}

export class SolanaMemoIsTooLong extends Error {
  override name = "SolanaMemoIsTooLong";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message || "SolanaMemoIsTooLong");
    if (fields) Object.assign(this, fields);
  }
}

export class SolanaTokenAccountHoldsAnotherToken extends Error {
  override name = "SolanaTokenAccountHoldsAnotherToken";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message || "SolanaTokenAccountHoldsAnotherToken");
    if (fields) Object.assign(this, fields);
  }
}

export class SolanaTokenAccountWarning extends Error {
  override name = "SolanaTokenAccountWarning";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message || "SolanaTokenAccountWarning");
    if (fields) Object.assign(this, fields);
  }
}

export class SolanaTokenAccountNotAllowed extends Error {
  override name = "SolanaTokenAccountNotAllowed";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message || "SolanaTokenAccountNotAllowed");
    if (fields) Object.assign(this, fields);
  }
}

export class SolanaMintAccountNotAllowed extends Error {
  override name = "SolanaMintAccountNotAllowed";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message || "SolanaMintAccountNotAllowed");
    if (fields) Object.assign(this, fields);
  }
}

export class SolanaTokenAccounNotInitialized extends Error {
  override name = "SolanaTokenAccounNotInitialized";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message || "SolanaTokenAccounNotInitialized");
    if (fields) Object.assign(this, fields);
  }
}

export class SolanaTokenAccountFrozen extends Error {
  override name = "SolanaTokenAccountFrozen";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message || "SolanaTokenAccountFrozen");
    if (fields) Object.assign(this, fields);
  }
}

export class SolanaAddressOffEd25519 extends Error {
  override name = "SolanaAddressOfEd25519";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message || "SolanaAddressOfEd25519");
    if (fields) Object.assign(this, fields);
  }
}

export class SolanaTokenRecipientIsSenderATA extends Error {
  override name = "SolanaTokenRecipientIsSenderATA";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message || "SolanaTokenRecipientIsSenderATA");
    if (fields) Object.assign(this, fields);
  }
}

export class SolanaValidatorRequired extends Error {
  override name = "SolanaValidatorRequired";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message || "SolanaValidatorRequired");
    if (fields) Object.assign(this, fields);
  }
}

export class SolanaInvalidValidator extends Error {
  override name = "SolanaInvalidValidator";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message || "SolanaInvalidValidator");
    if (fields) Object.assign(this, fields);
  }
}

export class SolanaStakeAccountRequired extends Error {
  override name = "SolanaStakeAccountRequired";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message || "SolanaStakeAccountRequired");
    if (fields) Object.assign(this, fields);
  }
}

export class SolanaStakeAccountNotFound extends Error {
  override name = "SolanaStakeAccountNotFound";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message || "SolanaStakeAccountNotFound");
    if (fields) Object.assign(this, fields);
  }
}

export class SolanaStakeAccountNothingToWithdraw extends Error {
  override name = "SolanaStakeAccountNothingToWithdraw";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message || "SolanaStakeAccountNothingToWithdraw");
    if (fields) Object.assign(this, fields);
  }
}

export class SolanaStakeAccountIsNotDelegatable extends Error {
  override name = "SolanaStakeAccountIsNotDelegatable";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message || "SolanaStakeAccountIsNotDelegatable");
    if (fields) Object.assign(this, fields);
  }
}

export class SolanaStakeAccountIsNotUndelegatable extends Error {
  override name = "SolanaStakeAccountIsNotUndelegatable";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message || "SolanaStakeAccountIsNotUndelegatable");
    if (fields) Object.assign(this, fields);
  }
}

export class SolanaStakeAccountValidatorIsUnchangeable extends Error {
  override name = "SolanaStakeAccountValidatorIsUnchangeable";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message || "SolanaStakeAccountValidatorIsUnchangeable");
    if (fields) Object.assign(this, fields);
  }
}

export class SolanaStakeAccountAmountTooLow extends Error {
  override name = "SolanaStakeAccountAmountTooLow";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message || "SolanaStakeAccountAmountTooLow");
    if (fields) Object.assign(this, fields);
  }
}

export class SolanaStakeNoWithdrawAuth extends Error {
  override name = "SolanaStakeNoWithdrawAuth";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message || "SolanaStakeNoWithdrawAuth");
    if (fields) Object.assign(this, fields);
  }
}

export class SolanaStakeNoStakeAuth extends Error {
  override name = "SolanaStakeNoStakeAuth";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message || "SolanaStakeNoStakeAuth");
    if (fields) Object.assign(this, fields);
  }
}

export class SolanaUseAllAmountStakeWarning extends Error {
  override name = "SolanaUseAllAmountStakeWarning";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message || "SolanaUseAllAmountStakeWarning");
    if (fields) Object.assign(this, fields);
  }
}

export class SolanaTxSimulationFailedWhilePendingOp extends Error {
  override name = "SolanaTxSimulationFailedWhilePendingOp";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message || "SolanaTxSimulationFailedWhilePendingOp");
    if (fields) Object.assign(this, fields);
  }
}

export class SolanaTxConfirmationTimeout extends Error {
  override name = "SolanaTxConfirmationTimeout";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message || "SolanaTxConfirmationTimeout");
    if (fields) Object.assign(this, fields);
  }
}

export class SolanaRecipientMemoIsRequired extends Error {
  override name = "SolanaRecipientMemoIsRequired";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message || "SolanaRecipientMemoIsRequired");
    if (fields) Object.assign(this, fields);
  }
}

export class SolanaTokenNonTransferable extends Error {
  override name = "SolanaTokenNonTransferable";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message || "SolanaTokenNonTransferable");
    if (fields) Object.assign(this, fields);
  }
}

export class NetworkError extends Error {
  override name = "NetworkError";
  constructor(message?: string, fields?: Record<string, unknown>, options?: ErrorOptions) {
    super(message || "NetworkError", options);
    if (fields) Object.assign(this, fields);
  }
}
