export class SolanaAccountNotFunded extends Error {
  override name = "SolanaAccountNotFunded";
  constructor(message?: string) {
    super(message ?? "SolanaAccountNotFunded");
  }
}

export class SolanaRecipientAccountNotFunded extends Error {
  override name = "SolanaRecipientAccountNotFunded";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message ?? "SolanaRecipientAccountNotFunded");
    if (fields) Object.assign(this, fields);
  }
}

export class SolanaRecipientAssociatedTokenAccountWillBeFunded extends Error {
  override name = "SolanaAssociatedTokenAccountWillBeFunded";
  constructor(message?: string) {
    super(message ?? "SolanaRecipientAssociatedTokenAccountWillBeFunded");
  }
}

export class SolanaMemoIsTooLong extends Error {
  override name = "SolanaMemoIsTooLong";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message ?? "SolanaMemoIsTooLong");
    if (fields) Object.assign(this, fields);
  }
}

export class SolanaTokenAccountHoldsAnotherToken extends Error {
  override name = "SolanaTokenAccountHoldsAnotherToken";
  constructor(message?: string) {
    super(message ?? "SolanaTokenAccountHoldsAnotherToken");
  }
}

export class SolanaTokenAccountWarning extends Error {
  override name = "SolanaTokenAccountWarning";
  constructor(message?: string) {
    super(message ?? "SolanaTokenAccountWarning");
  }
}

export class SolanaTokenAccountNotAllowed extends Error {
  override name = "SolanaTokenAccountNotAllowed";
  constructor(message?: string) {
    super(message ?? "SolanaTokenAccountNotAllowed");
  }
}

export class SolanaMintAccountNotAllowed extends Error {
  override name = "SolanaMintAccountNotAllowed";
  constructor(message?: string) {
    super(message ?? "SolanaMintAccountNotAllowed");
  }
}

export class SolanaTokenAccounNotInitialized extends Error {
  override name = "SolanaTokenAccounNotInitialized";
  constructor(message?: string) {
    super(message ?? "SolanaTokenAccounNotInitialized");
  }
}

export class SolanaTokenAccountFrozen extends Error {
  override name = "SolanaTokenAccountFrozen";
  constructor(message?: string) {
    super(message ?? "SolanaTokenAccountFrozen");
  }
}

export class SolanaAddressOffEd25519 extends Error {
  override name = "SolanaAddressOfEd25519";
  constructor(message?: string) {
    super(message ?? "SolanaAddressOffEd25519");
  }
}

export class SolanaTokenRecipientIsSenderATA extends Error {
  override name = "SolanaTokenRecipientIsSenderATA";
  constructor(message?: string) {
    super(message ?? "SolanaTokenRecipientIsSenderATA");
  }
}

export class SolanaValidatorRequired extends Error {
  override name = "SolanaValidatorRequired";
  constructor(message?: string) {
    super(message ?? "SolanaValidatorRequired");
  }
}

export class SolanaInvalidValidator extends Error {
  override name = "SolanaInvalidValidator";
  constructor(message?: string) {
    super(message ?? "SolanaInvalidValidator");
  }
}

export class SolanaStakeAccountRequired extends Error {
  override name = "SolanaStakeAccountRequired";
  constructor(message?: string) {
    super(message ?? "SolanaStakeAccountRequired");
  }
}

export class SolanaStakeAccountNotFound extends Error {
  override name = "SolanaStakeAccountNotFound";
  constructor(message?: string) {
    super(message ?? "SolanaStakeAccountNotFound");
  }
}

export class SolanaStakeAccountNothingToWithdraw extends Error {
  override name = "SolanaStakeAccountNothingToWithdraw";
  constructor(message?: string) {
    super(message ?? "SolanaStakeAccountNothingToWithdraw");
  }
}

export class SolanaStakeAccountIsNotDelegatable extends Error {
  override name = "SolanaStakeAccountIsNotDelegatable";
  constructor(message?: string) {
    super(message ?? "SolanaStakeAccountIsNotDelegatable");
  }
}

export class SolanaStakeAccountIsNotUndelegatable extends Error {
  override name = "SolanaStakeAccountIsNotUndelegatable";
  constructor(message?: string) {
    super(message ?? "SolanaStakeAccountIsNotUndelegatable");
  }
}

export class SolanaStakeAccountValidatorIsUnchangeable extends Error {
  override name = "SolanaStakeAccountValidatorIsUnchangeable";
  constructor(message?: string) {
    super(message ?? "SolanaStakeAccountValidatorIsUnchangeable");
  }
}

export class SolanaStakeAccountAmountTooLow extends Error {
  override name = "SolanaStakeAccountAmountTooLow";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message ?? "SolanaStakeAccountAmountTooLow");
    if (fields) Object.assign(this, fields);
  }
}

export class SolanaStakeNoWithdrawAuth extends Error {
  override name = "SolanaStakeNoWithdrawAuth";
  constructor(message?: string) {
    super(message ?? "SolanaStakeNoWithdrawAuth");
  }
}

export class SolanaStakeNoStakeAuth extends Error {
  override name = "SolanaStakeNoStakeAuth";
  constructor(message?: string) {
    super(message ?? "SolanaStakeNoStakeAuth");
  }
}

export class SolanaUseAllAmountStakeWarning extends Error {
  override name = "SolanaUseAllAmountStakeWarning";
  constructor(message?: string) {
    super(message ?? "SolanaUseAllAmountStakeWarning");
  }
}

export class SolanaTxSimulationFailedWhilePendingOp extends Error {
  override name = "SolanaTxSimulationFailedWhilePendingOp";
  constructor(message?: string) {
    super(message ?? "SolanaTxSimulationFailedWhilePendingOp");
  }
}

export class SolanaTxConfirmationTimeout extends Error {
  override name = "SolanaTxConfirmationTimeout";
  constructor(message?: string) {
    super(message ?? "SolanaTxConfirmationTimeout");
  }
}

export class SolanaRecipientMemoIsRequired extends Error {
  override name = "SolanaRecipientMemoIsRequired";
  constructor(message?: string) {
    super(message ?? "SolanaRecipientMemoIsRequired");
  }
}

export class SolanaTokenNonTransferable extends Error {
  override name = "SolanaTokenNonTransferable";
  constructor(message?: string) {
    super(message ?? "SolanaTokenNonTransferable");
  }
}

export class NotEnoughGas extends Error {
  override name = "NotEnoughGas";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message ?? "NotEnoughGas");
    if (fields) Object.assign(this, fields);
  }
}

export class NetworkError extends Error {
  override name = "NetworkError";
  constructor(message?: string, fields?: Record<string, unknown>, options?: { cause?: unknown }) {
    super(message ?? "NetworkError");
    if (fields) Object.assign(this, fields);
    if (options?.cause !== undefined) Object.assign(this, { cause: options.cause });
  }
}
