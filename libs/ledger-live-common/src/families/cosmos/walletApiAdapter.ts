import createTransaction from "@ledgerhq/coin-cosmos/createTransaction";
import { CosmosTransaction as WalletAPICosmosTransaction } from "@ledgerhq/wallet-api-core";
import {
  AreFeesProvided,
  ConvertToLiveTransaction,
  GetWalletAPITransactionSignFlowInfos,
} from "../../wallet-api/types";
import { CosmosOperationMode, Transaction } from "@ledgerhq/coin-cosmos/types/index";
import { cosmosMemoPatch } from "../../bridge/descriptor/send/memo";

const CAN_EDIT_FEES = true;

// Wallet API callers put the moved stake on the validator entry for these modes, not on `amount`.
const VALIDATOR_AMOUNT_MODES: ReadonlySet<CosmosOperationMode> = new Set([
  "undelegate",
  "redelegate",
  "claimRewardCompound",
]);

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
    Object.assign(liveTx, cosmosMemoPatch(walletApiTransaction.memo));
  }

  if (liveTx.mode === "send") {
    return liveTx;
  }

  const validator = walletApiTransaction.validators?.[0];
  if (validator && VALIDATOR_AMOUNT_MODES.has(liveTx.mode)) {
    liveTx.amount = validator.amount;
  }

  if (liveTx.mode === "redelegate") {
    return {
      ...liveTx,
      valAddress: walletApiTransaction.sourceValidator ?? "",
      dstValAddress: validator?.address ?? "",
    };
  }

  return { ...liveTx, valAddress: validator?.address ?? "" };
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
