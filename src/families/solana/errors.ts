import { createCustomErrorClass } from "@ledgerhq/errors";

export const SolanaAccountNotFunded = createCustomErrorClass(
  "SolanaAccountNotFunded"
);

export const SolanaRecipientAssociatedTokenAccountWillBeFunded =
  createCustomErrorClass("SolanaAssociatedTokenAccountWillBeFunded");

export const SolanaMemoIsTooLong = createCustomErrorClass(
  "SolanaMemoIsTooLong"
);

export const SolanaTokenAccountHoldsAnotherToken = createCustomErrorClass(
  "SolanaTokenAccountHoldsAnotherToken"
);

export const SolanaTokenAccounNotInitialized = createCustomErrorClass(
  "SolanaTokenAccounNotInitialized"
);

export const SolanaAddressOffEd25519 = createCustomErrorClass(
  "SolanaAddressOfEd25519"
);

export const SolanaTokenRecipientIsSenderATA = createCustomErrorClass(
  "SolanaTokenRecipientIsSenderATA"
);
