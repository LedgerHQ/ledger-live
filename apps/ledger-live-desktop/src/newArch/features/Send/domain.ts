// Help to follow each step of the send flow with the step name
export const SEND_STEP = {
  ASSET: "asset",
  NETWORK: "network",
  ACCOUNT: "account",
  RECIPIENT: "recipient",
  AMOUNT: "amount",
  SUMMARY: "summary",
  DEVICE: "device",
  CONFIRMATION: "confirmation",
  WARNING: "warning",
};

export type SendStep = (typeof SEND_STEP)[keyof typeof SEND_STEP];
