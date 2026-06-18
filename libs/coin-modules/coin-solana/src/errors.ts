export class SolanaAccountNotFunded extends Error {
  override name = "SolanaAccountNotFunded";
  constructor(message = "SolanaAccountNotFunded") {
    super(message);
  }
}

export class SolanaRecipientAccountNotFunded extends Error {
  override name = "SolanaRecipientAccountNotFunded";
  constructor(message = "SolanaRecipientAccountNotFunded", fields?: Record<string, unknown>) {
    super(message);
    if (fields) Object.assign(this, fields);
  }
}

export class SolanaRecipientAssociatedTokenAccountWillBeFunded extends Error {
  override name = "SolanaAssociatedTokenAccountWillBeFunded";
  constructor(message = "SolanaAssociatedTokenAccountWillBeFunded") {
    super(message);
  }
}

export class SolanaMemoIsTooLong extends Error {
  override name = "SolanaMemoIsTooLong";
  constructor(message = "SolanaMemoIsTooLong", fields?: Record<string, unknown>) {
    super(message);
    if (fields) Object.assign(this, fields);
  }
}

export class SolanaTokenAccountHoldsAnotherToken extends Error {
  override name = "SolanaTokenAccountHoldsAnotherToken";
  constructor(message = "SolanaTokenAccountHoldsAnotherToken") {
    super(message);
  }
}

export class SolanaTokenAccountWarning extends Error {
  override name = "SolanaTokenAccountWarning";
  constructor(message = "SolanaTokenAccountWarning") {
    super(message);
  }
}

export class SolanaTokenAccountNotAllowed extends Error {
  override name = "SolanaTokenAccountNotAllowed";
  constructor(message = "SolanaTokenAccountNotAllowed") {
    super(message);
  }
}

export class SolanaMintAccountNotAllowed extends Error {
  override name = "SolanaMintAccountNotAllowed";
  constructor(message = "SolanaMintAccountNotAllowed") {
    super(message);
  }
}

export class SolanaTokenAccounNotInitialized extends Error {
  override name = "SolanaTokenAccounNotInitialized";
  constructor(message = "SolanaTokenAccounNotInitialized") {
    super(message);
  }
}

export class SolanaTokenAccountFrozen extends Error {
  override name = "SolanaTokenAccountFrozen";
  constructor(message = "SolanaTokenAccountFrozen") {
    super(message);
  }
}

export class SolanaAddressOffEd25519 extends Error {
  override name = "SolanaAddressOfEd25519";
  constructor(message = "SolanaAddressOfEd25519") {
    super(message);
  }
}

export class SolanaTokenRecipientIsSenderATA extends Error {
  override name = "SolanaTokenRecipientIsSenderATA";
  constructor(message = "SolanaTokenRecipientIsSenderATA") {
    super(message);
  }
}

export class SolanaValidatorRequired extends Error {
  override name = "SolanaValidatorRequired";
  constructor(message = "SolanaValidatorRequired") {
    super(message);
  }
}

export class SolanaInvalidValidator extends Error {
  override name = "SolanaInvalidValidator";
  constructor(message = "SolanaInvalidValidator") {
    super(message);
  }
}

export class SolanaStakeAccountRequired extends Error {
  override name = "SolanaStakeAccountRequired";
  constructor(message = "SolanaStakeAccountRequired") {
    super(message);
  }
}

export class SolanaStakeAccountNotFound extends Error {
  override name = "SolanaStakeAccountNotFound";
  constructor(message = "SolanaStakeAccountNotFound") {
    super(message);
  }
}

export class SolanaStakeAccountNothingToWithdraw extends Error {
  override name = "SolanaStakeAccountNothingToWithdraw";
  constructor(message = "SolanaStakeAccountNothingToWithdraw") {
    super(message);
  }
}

export class SolanaStakeAccountIsNotDelegatable extends Error {
  override name = "SolanaStakeAccountIsNotDelegatable";
  constructor(message = "SolanaStakeAccountIsNotDelegatable") {
    super(message);
  }
}

export class SolanaStakeAccountIsNotUndelegatable extends Error {
  override name = "SolanaStakeAccountIsNotUndelegatable";
  constructor(message = "SolanaStakeAccountIsNotUndelegatable") {
    super(message);
  }
}

export class SolanaStakeAccountValidatorIsUnchangeable extends Error {
  override name = "SolanaStakeAccountValidatorIsUnchangeable";
  constructor(message = "SolanaStakeAccountValidatorIsUnchangeable") {
    super(message);
  }
}

export class SolanaStakeNoWithdrawAuth extends Error {
  override name = "SolanaStakeNoWithdrawAuth";
  constructor(message = "SolanaStakeNoWithdrawAuth") {
    super(message);
  }
}

export class SolanaStakeNoStakeAuth extends Error {
  override name = "SolanaStakeNoStakeAuth";
  constructor(message = "SolanaStakeNoStakeAuth") {
    super(message);
  }
}

export class SolanaUseAllAmountStakeWarning extends Error {
  override name = "SolanaUseAllAmountStakeWarning";
  constructor(message = "SolanaUseAllAmountStakeWarning") {
    super(message);
  }
}

export class SolanaTxSimulationFailedWhilePendingOp extends Error {
  override name = "SolanaTxSimulationFailedWhilePendingOp";
  constructor(message = "SolanaTxSimulationFailedWhilePendingOp") {
    super(message);
  }
}

export class SolanaTxConfirmationTimeout extends Error {
  override name = "SolanaTxConfirmationTimeout";
  constructor(message = "SolanaTxConfirmationTimeout") {
    super(message);
  }
}

export class SolanaRecipientMemoIsRequired extends Error {
  override name = "SolanaRecipientMemoIsRequired";
  constructor(message = "SolanaRecipientMemoIsRequired") {
    super(message);
  }
}

export class SolanaTokenNonTransferable extends Error {
  override name = "SolanaTokenNonTransferable";
  constructor(message = "SolanaTokenNonTransferable") {
    super(message);
  }
}
