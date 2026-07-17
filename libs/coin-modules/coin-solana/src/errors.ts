export class SolanaAccountNotFunded extends Error {
  override name = "SolanaAccountNotFunded";
}

export class SolanaRecipientAccountNotFunded extends Error {
  override name = "SolanaRecipientAccountNotFunded";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message);
    if (fields) Object.assign(this, fields);
  }
}

export class SolanaRecipientAssociatedTokenAccountWillBeFunded extends Error {
  override name = "SolanaAssociatedTokenAccountWillBeFunded";
}

export class SolanaMemoIsTooLong extends Error {
  override name = "SolanaMemoIsTooLong";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message);
    if (fields) Object.assign(this, fields);
  }
}

export class SolanaTokenAccountHoldsAnotherToken extends Error {
  override name = "SolanaTokenAccountHoldsAnotherToken";
}

export class SolanaTokenAccountWarning extends Error {
  override name = "SolanaTokenAccountWarning";
}

export class SolanaTokenAccountNotAllowed extends Error {
  override name = "SolanaTokenAccountNotAllowed";
}

export class SolanaMintAccountNotAllowed extends Error {
  override name = "SolanaMintAccountNotAllowed";
}

export class SolanaTokenAccounNotInitialized extends Error {
  override name = "SolanaTokenAccounNotInitialized";
}

export class SolanaTokenAccountFrozen extends Error {
  override name = "SolanaTokenAccountFrozen";
}

export class SolanaAddressOffEd25519 extends Error {
  override name = "SolanaAddressOfEd25519";
}

export class SolanaTokenRecipientIsSenderATA extends Error {
  override name = "SolanaTokenRecipientIsSenderATA";
}

export class SolanaValidatorRequired extends Error {
  override name = "SolanaValidatorRequired";
}

export class SolanaInvalidValidator extends Error {
  override name = "SolanaInvalidValidator";
}

export class SolanaStakeAccountRequired extends Error {
  override name = "SolanaStakeAccountRequired";
}

export class SolanaStakeAccountNotFound extends Error {
  override name = "SolanaStakeAccountNotFound";
}

export class SolanaStakeAccountNothingToWithdraw extends Error {
  override name = "SolanaStakeAccountNothingToWithdraw";
}

export class SolanaStakeAccountIsNotDelegatable extends Error {
  override name = "SolanaStakeAccountIsNotDelegatable";
}

export class SolanaStakeAccountIsNotUndelegatable extends Error {
  override name = "SolanaStakeAccountIsNotUndelegatable";
}

export class SolanaStakeAccountValidatorIsUnchangeable extends Error {
  override name = "SolanaStakeAccountValidatorIsUnchangeable";
}

export class SolanaStakeAccountAmountTooLow extends Error {
  override name = "SolanaStakeAccountAmountTooLow";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message);
    if (fields) Object.assign(this, fields);
  }
}

export class SolanaStakeNoWithdrawAuth extends Error {
  override name = "SolanaStakeNoWithdrawAuth";
}

export class SolanaStakeNoStakeAuth extends Error {
  override name = "SolanaStakeNoStakeAuth";
}

export class SolanaUseAllAmountStakeWarning extends Error {
  override name = "SolanaUseAllAmountStakeWarning";
}

export class SolanaTxSimulationFailedWhilePendingOp extends Error {
  override name = "SolanaTxSimulationFailedWhilePendingOp";
}

export class SolanaTxConfirmationTimeout extends Error {
  override name = "SolanaTxConfirmationTimeout";
}

export class SolanaRecipientMemoIsRequired extends Error {
  override name = "SolanaRecipientMemoIsRequired";
}

export class SolanaTokenNonTransferable extends Error {
  override name = "SolanaTokenNonTransferable";
}

export class NotEnoughGas extends Error {
  override name = "NotEnoughGas";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message);
    if (fields) Object.assign(this, fields);
  }
}

export class NetworkError extends Error {
  override name = "NetworkError";
  constructor(message?: string, fields?: Record<string, unknown>, options?: { cause?: unknown }) {
    super(message);
    if (fields) Object.assign(this, fields);
    if (options?.cause !== undefined) Object.assign(this, { cause: options.cause });
  }
}
