import { PolkadotTransaction as WalletAPIPolkadotTransaction } from "@ledgerhq/wallet-api-core";
import {
  ConvertToLiveTransaction,
  GetWalletAPITransactionSignFlowInfos,
} from "../../wallet-api/types";

import { Transaction } from "@ledgerhq/coin-polkadot/types";

const CAN_EDIT_FEES = false;

const convertToLiveTransaction: ConvertToLiveTransaction<
  WalletAPIPolkadotTransaction,
  Transaction
> = (tx) => ({
  ...tx,
  era: tx.era ? `${tx.era}` : undefined,
});

const getWalletAPITransactionSignFlowInfos: GetWalletAPITransactionSignFlowInfos<
  WalletAPIPolkadotTransaction,
  Transaction
> = (tx) => {
  return {
    canEditFees: CAN_EDIT_FEES,
    liveTx: convertToLiveTransaction(tx),
    hasFeesProvided: false,
  };
};

export default { getWalletAPITransactionSignFlowInfos };
