import type { CoinDescriptor } from "../../../bridge/descriptor/types";
import { isPrivateDestination, isPrivateTransaction } from "../utils";
import { aleoBalanceTypeConfig, isAleoFlowTransaction } from "./balanceType";

type AleoPrivacy = "public" | "private";

export type AleoPrivacyAttributes = Readonly<{
  privacy: AleoPrivacy;
  transferFlow?: `${AleoPrivacy}-to-${AleoPrivacy}`;
}>;

export function getPrivacyAttributes(transaction: unknown): AleoPrivacyAttributes | undefined {
  if (!isAleoFlowTransaction(transaction)) return undefined;

  const source: AleoPrivacy = isPrivateTransaction(transaction) ? "private" : "public";
  if (!transaction.recipient) return { privacy: source };

  const destination: AleoPrivacy = isPrivateDestination(transaction) ? "private" : "public";
  return { privacy: source, transferFlow: `${source}-to-${destination}` };
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
    getTrackingAttributes: transaction => getPrivacyAttributes(transaction) ?? {},
  },
};
