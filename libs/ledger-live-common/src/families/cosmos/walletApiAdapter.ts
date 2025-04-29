import createTransaction from "@ledgerhq/coin-cosmos/createTransaction";
import { CosmosTransaction as WalletAPICosmosTransaction } from "@ledgerhq/wallet-api-core";
import {
  AreFeesProvided,
  ConvertToLiveTransaction,
  GetWalletAPITransactionSignFlowInfos,
} from "../../wallet-api/types";
import { Transaction } from "@ledgerhq/coin-cosmos/types/index";

const CAN_EDIT_FEES = true;

const areFeesProvided: AreFeesProvided<WalletAPICosmosTransaction> = tx => !!tx.fees;

const convertToLiveTransaction: ConvertToLiveTransaction<
  WalletAPICosmosTransaction,
  Transaction
> = ({ account, walletApiTransaction }) => {
  const liveTx: Transaction = createTransaction(account);

  if (walletApiTransaction.amount) {
    liveTx.amount = walletApiTransaction.amount;
  }

  if (walletApiTransaction.recipient) {
    liveTx.recipient = walletApiTransaction.recipient;
  }

  if (walletApiTransaction.mode) {
    liveTx.mode = walletApiTransaction.mode;
  }

  if (walletApiTransaction.fees) {
    liveTx.fees = walletApiTransaction.fees;
  }

  if (walletApiTransaction.gas) {
    liveTx.gas = walletApiTransaction.gas;
  }

  if (walletApiTransaction.memo) {
    liveTx.memo = walletApiTransaction.memo;
  }

  if (walletApiTransaction.sourceValidator) {
    liveTx.sourceValidator = walletApiTransaction.sourceValidator;
  }

  if (walletApiTransaction.validators) {
    liveTx.validators = walletApiTransaction.validators;
  }

  return liveTx;
};

const getWalletAPITransactionSignFlowInfos: GetWalletAPITransactionSignFlowInfos<
  WalletAPICosmosTransaction,
  Transaction
> = ({ walletApiTransaction, account }) => {
  return {
    canEditFees: CAN_EDIT_FEES,
    liveTx: convertToLiveTransaction({ walletApiTransaction, account }),
    hasFeesProvided: areFeesProvided(walletApiTransaction),
  };
};

export default { getWalletAPITransactionSignFlowInfos };
