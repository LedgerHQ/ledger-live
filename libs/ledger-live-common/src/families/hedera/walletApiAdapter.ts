import type { HederaTransaction as WalletAPIHederaTransaction } from "@ledgerhq/wallet-api-core";
import type { GetWalletAPITransactionSignFlowInfos } from "../../wallet-api/types";
import type { HederaGenericTransaction } from "./types";

// The generic bridge reads only `memoType` / `memoValue`, so a passed-through `memo` would be dropped.
const getWalletAPITransactionSignFlowInfos: GetWalletAPITransactionSignFlowInfos<
  WalletAPIHederaTransaction,
  HederaGenericTransaction
> = ({ walletApiTransaction }) => {
  const { memo, ...common } = walletApiTransaction;

  return {
    canEditFees: false,
    hasFeesProvided: false,
    liveTx: {
      ...common,
      family: "hedera",
      ...(memo && { memoType: "string", memoValue: memo }),
    },
  };
};

export default { getWalletAPITransactionSignFlowInfos };
