import { RippleTransaction as WalletAPIRippleTransaction } from "@ledgerhq/wallet-api-core";
import { AreFeesProvided, GetWalletAPITransactionSignFlowInfos } from "../../wallet-api/types";
import { Transaction } from "@ledgerhq/coin-xrp/types";

const CAN_EDIT_FEES = true;

const areFeesProvided: AreFeesProvided<WalletAPIRippleTransaction> = tx => !!tx.fee;

const getWalletAPITransactionSignFlowInfos: GetWalletAPITransactionSignFlowInfos<
  WalletAPIRippleTransaction,
  Transaction
> = ({ walletApiTransaction }) => {
  return {
    canEditFees: CAN_EDIT_FEES,
    liveTx: { ...walletApiTransaction, family: "xrp" },
    hasFeesProvided: areFeesProvided(walletApiTransaction),
  };
};

export default { getWalletAPITransactionSignFlowInfos };
