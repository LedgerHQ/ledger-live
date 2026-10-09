export const APP_NAME = "Hedera";

export const CLA = 0xe0;

export const INS = {
  GET_APP_CONFIGURATION: 0x01,
  GET_PUBLIC_KEY: 0x02,
  SIGN_TRANSACTION: 0x04,
} as const;

// See: https://github.com/LedgerHQ/app-hedera/blob/master/src/get_public_key.c and https://github.com/LedgerHQ/app-hedera/blob/master/src/hedera.c
export const KEY_INDEX_SIZE = 4;

const MAX_APDU_DATA_SIZE = 255;
export const MAX_TRANSACTION_SIZE = MAX_APDU_DATA_SIZE - KEY_INDEX_SIZE;
