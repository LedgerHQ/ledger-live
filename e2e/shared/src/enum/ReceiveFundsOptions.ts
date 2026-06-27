export const ReceiveFundsOptions = {
  CRYPTO: "crypto",
  FIAT: "fiat",
} as const;

export type ReceiveFundsOptionsType =
  (typeof ReceiveFundsOptions)[keyof typeof ReceiveFundsOptions];
