export const PROGRAM_ID = {
  CREDITS: "credits.aleo",
} as const;

export const TRANSFERS = {
  PRIVATE: "transfer_private",
  PUBLIC: "transfer_public",
  PRIVATE_TO_PUBLIC: "transfer_private_to_public",
  PUBLIC_TO_PRIVATE: "transfer_public_to_private",
} as const;

export const RECIPIENT_ARG_INDEX = 1;
export const AMOUNT_ARG_INDEX = 2;

export const U64_SUFFIX = "u64";
export const U64_PRIVATE_SUFFIX = "u64.private";
