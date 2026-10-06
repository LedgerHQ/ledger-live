import type { CoinDescriptor } from "../../../bridge/descriptor/types";
import { TRANSACTION_TYPE } from "../constants";
import type { Transaction as AleoTransaction } from "../types";
import { aleoBalanceTypeConfig, isAleoTransaction } from "./balanceType";
import { estimatedTime } from "./estimatedTime";

type AleoTransferFlow =
  | "public-to-public"
  | "public-to-private"
  | "private-to-public"
  | "private-to-private";

export type AleoPrivacyAttributes = Readonly<{
  privacy: "public" | "private";
  transferFlow: AleoTransferFlow;
}>;

const PRIVACY_BY_MODE: Partial<Record<AleoTransaction["mode"], AleoPrivacyAttributes>> = {
  [TRANSACTION_TYPE.TRANSFER_PUBLIC]: { privacy: "public", transferFlow: "public-to-public" },
  [TRANSACTION_TYPE.TRANSFER_TOKEN_PUBLIC]: { privacy: "public", transferFlow: "public-to-public" },
  [TRANSACTION_TYPE.CONVERT_PUBLIC_TO_PRIVATE]: {
    privacy: "public",
    transferFlow: "public-to-private",
  },
  [TRANSACTION_TYPE.CONVERT_TOKEN_PUBLIC_TO_PRIVATE]: {
    privacy: "public",
    transferFlow: "public-to-private",
  },
  [TRANSACTION_TYPE.CONVERT_PRIVATE_TO_PUBLIC]: {
    privacy: "private",
    transferFlow: "private-to-public",
  },
  [TRANSACTION_TYPE.CONVERT_TOKEN_PRIVATE_TO_PUBLIC]: {
    privacy: "private",
    transferFlow: "private-to-public",
  },
  [TRANSACTION_TYPE.TRANSFER_PRIVATE]: { privacy: "private", transferFlow: "private-to-private" },
  [TRANSACTION_TYPE.TRANSFER_TOKEN_PRIVATE]: {
    privacy: "private",
    transferFlow: "private-to-private",
  },
};

export function getPrivacyAttributes(transaction: unknown): AleoPrivacyAttributes | undefined {
  if (!isAleoTransaction(transaction)) return undefined;
  return PRIVACY_BY_MODE[transaction.mode];
}

export const descriptor: CoinDescriptor = {
  send: {
    inputs: {},
    fees: {
      hasPresets: false,
      hasCustom: false,
      hasCoinControl: false,
    },
    selfTransfer: "free",
    balanceType: aleoBalanceTypeConfig,
    estimatedTime,
    getTrackingAttributes: transaction => getPrivacyAttributes(transaction) ?? {},
  },
};
