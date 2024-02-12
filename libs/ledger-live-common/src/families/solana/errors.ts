import { createCustomErrorClass } from "@ledgerhq/errors";

export const SolanaAccountNotFunded = createCustomErrorClass("SolanaAccountNotFunded");

export const SolanaRecipientAssociatedTokenAccountWillBeFunded = createCustomErrorClass(
  "SolanaAssociatedTokenAccountWillBeFunded",
);

export const SolanaMemoIsTooLong = createCustomErrorClass("SolanaMemoIsTooLong");

export const SolanaTokenAccountHoldsAnotherToken = createCustomErrorClass(
  "SolanaTokenAccountHoldsAnotherToken",
);

export const SolanaTokenAccounNotInitialized = createCustomErrorClass(
  "SolanaTokenAccounNotInitialized",
);

export const SolanaAddressOffEd25519 = createCustomErrorClass("SolanaAddressOfEd25519");

export const SolanaTokenRecipientIsSenderATA = createCustomErrorClass(
  "SolanaTokenRecipientIsSenderATA",
);

export const SolanaValidatorRequired = createCustomErrorClass("SolanaValidatorRequired");

export const SolanaInvalidValidator = createCustomErrorClass("SolanaInvalidValidator");

export const SolanaStakeAccountRequired = createCustomErrorClass("SolanaStakeAccountRequired");

export const SolanaStakeAccountNotFound = createCustomErrorClass("SolanaStakeAccountNotFound");

export const SolanaStakeAccountNothingToWithdraw = createCustomErrorClass(
  "SolanaStakeAccountNothingToWithdraw",
);

export const SolanaStakeAccountIsNotDelegatable = createCustomErrorClass(
  "SolanaStakeAccountIsNotDelegatable",
);

export const SolanaStakeAccountIsNotUndelegatable = createCustomErrorClass(
  "SolanaStakeAccountIsNotUndelegatable",
);

export const SolanaStakeAccountValidatorIsUnchangeable = createCustomErrorClass(
  "SolanaStakeAccountValidatorIsUnchangeable",
);

export const SolanaStakeNoWithdrawAuth = createCustomErrorClass("SolanaStakeNoWithdrawAuth");

export const SolanaStakeNoStakeAuth = createCustomErrorClass("SolanaStakeNoStakeAuth");

export const SolanaUseAllAmountStakeWarning = createCustomErrorClass(
  "SolanaUseAllAmountStakeWarning",
);

export const SolanaTxSimulationFailedWhilePendingOp = createCustomErrorClass(
  "SolanaTxSimulationFailedWhilePendingOp",
);

export const SolanaTxConfirmationTimeout = createCustomErrorClass("SolanaTxConfirmationTimeout");
