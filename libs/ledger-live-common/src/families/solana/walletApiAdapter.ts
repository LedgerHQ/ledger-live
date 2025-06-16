import { SolanaTransaction as WalletAPISolanaTransaction } from "@ledgerhq/wallet-api-core";
import { GetWalletAPITransactionSignFlowInfos } from "../../wallet-api/types";
import { Transaction } from "@ledgerhq/coin-solana/types";

const CAN_EDIT_FEES = false;

const HAS_FEES_PROVIDED = false;

const getWalletAPITransactionSignFlowInfos: GetWalletAPITransactionSignFlowInfos<
  WalletAPISolanaTransaction,
  Transaction
> = ({ walletApiTransaction, account }) => {
  const liveTx: Transaction = {
    ...walletApiTransaction,
    model: { ...walletApiTransaction.model, commandDescriptor: undefined },
  };

  if (!liveTx.subAccountId && account.type === "TokenAccount") {
    liveTx.subAccountId = account.id;
  }

  return {
    canEditFees: CAN_EDIT_FEES,
    liveTx,
    hasFeesProvided: HAS_FEES_PROVIDED,
  };
};

export default { getWalletAPITransactionSignFlowInfos };
