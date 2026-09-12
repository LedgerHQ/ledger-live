export const ENCRYPTED_APP_KEYS = ["accounts", "trustchain", "wallet"] as const;

export type EncryptedAppKey = (typeof ENCRYPTED_APP_KEYS)[number];
