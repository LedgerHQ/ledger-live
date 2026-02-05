export const PROGRAM_ID = {
  CREDITS: "credits.aleo",
} as const;

export const EXPLORER_TRANSFER_TYPES = {
  PRIVATE: "transfer_private",
  PUBLIC: "transfer_public",
  PRIVATE_TO_PUBLIC: "transfer_private_to_public",
  PUBLIC_TO_PRIVATE: "transfer_public_to_private",
} as const;

// INDEXES BASED ON ALEO CREDITS PROGRAM ARGS
export const RECIPIENT_ARG_INDEX = 1;
export const AMOUNT_ARG_INDEX = 2;
