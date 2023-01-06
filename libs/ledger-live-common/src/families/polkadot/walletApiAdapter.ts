import { PolkadotTransaction as WalletAPITransaction } from "@ledgerhq/wallet-api-core";
import { Transaction } from "./types";

const CAN_EDIT_FEES = false;

const convertToLiveTransaction = (
  tx: WalletAPITransaction
): Partial<Transaction> => ({
  ...tx,
  era: tx.era ? `${tx.era}` : undefined,
});

const getWalletAPITransactionSignFlowInfos = (
  tx: WalletAPITransaction
): {
  canEditFees: boolean;
  hasFeesProvided: boolean;
  liveTx: Partial<Transaction>;
} => {
  return {
    canEditFees: CAN_EDIT_FEES,
    liveTx: convertToLiveTransaction(tx),
    hasFeesProvided: false,
  };
};

export default { getWalletAPITransactionSignFlowInfos };
