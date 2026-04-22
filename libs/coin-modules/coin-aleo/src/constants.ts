export const PROGRAM_ID = {
  CREDITS: "credits.aleo",
};

export const EXPLORER_TRANSFER_TYPES = {
  PRIVATE: "transfer_private",
  PUBLIC: "transfer_public",
  PRIVATE_TO_PUBLIC: "transfer_private_to_public",
  PUBLIC_TO_PRIVATE: "transfer_public_to_private",
};

export const TRANSACTION_TYPE = {
  TRANSFER_PUBLIC: "transfer_public",
  TRANSFER_PRIVATE: "transfer_private",
  CONVERT_PUBLIC_TO_PRIVATE: "convert_public_to_private",
  CONVERT_PRIVATE_TO_PUBLIC: "convert_private_to_public",
} as const;

// Indexes based on aleo credits program args
// ref: https://developer.aleo.org/concepts/fundamentals/credits/#transfer_public
export const RECIPIENT_ARG_INDEX = 1;
export const AMOUNT_ARG_INDEX = 2;

// The maximum amount of records to fetch in a single API call when fetching owned records. This is not a limit on the total number of records that can be fetched, but rather a pagination parameter for the API calls.
export const DEFAULT_RECORDS_PAGE_SIZE = 1000;
