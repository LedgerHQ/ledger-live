import createTransaction from "@ledgerhq/coin-polkadot/js-createTransaction";
import { Transaction } from "@ledgerhq/coin-polkadot/types/index";
import { PolkadotTransaction as WalletAPIPolkadotTransaction } from "@ledgerhq/wallet-api-core";
import {
  AreFeesProvided,
  ConvertToLiveTransaction,
  GetWalletAPITransactionSignFlowInfos,
} from "../../wallet-api/types";

const CAN_EDIT_FEES = true;

const areFeesProvided: AreFeesProvided<WalletAPIPolkadotTransaction> = tx => !!tx.fee;

const convertToLiveTransaction: ConvertToLiveTransaction<
  WalletAPIPolkadotTransaction,
  Transaction
> = ({ walletApiTransaction }) => {
  const hasFeesProvided = areFeesProvided(walletApiTransaction);

  const liveTx: Transaction = createTransaction();

  if (walletApiTransaction.amount) {
    liveTx.amount = walletApiTransaction.amount;
  }

  if (walletApiTransaction.recipient) {
    liveTx.recipient = walletApiTransaction.recipient;
  }

  if (walletApiTransaction.mode) {
    liveTx.mode = walletApiTransaction.mode;
  }

  if (walletApiTransaction.fee) {
    liveTx.fees = walletApiTransaction.fee;
  }

  if (walletApiTransaction.era) {
    liveTx.era = `${walletApiTransaction.era}`;
  }

  if (walletApiTransaction.rewardDestination) {
    liveTx.rewardDestination = walletApiTransaction.rewardDestination;
  }

  if (walletApiTransaction.validators) {
    liveTx.validators = walletApiTransaction.validators;
  }

  if (walletApiTransaction.numOfSlashingSpans) {
    liveTx.numSlashingSpans = walletApiTransaction.numOfSlashingSpans;
  }

  if (hasFeesProvided) {
    liveTx.feesStrategy = null;
  }

  return liveTx;
};

const getWalletAPITransactionSignFlowInfos: GetWalletAPITransactionSignFlowInfos<
  WalletAPIPolkadotTransaction,
  Transaction
> = ({ walletApiTransaction, account }) => {
  return {
    canEditFees: CAN_EDIT_FEES,
    liveTx: convertToLiveTransaction({ walletApiTransaction, account }),
    hasFeesProvided: areFeesProvided(walletApiTransaction),
  };
};

export default { getWalletAPITransactionSignFlowInfos };
