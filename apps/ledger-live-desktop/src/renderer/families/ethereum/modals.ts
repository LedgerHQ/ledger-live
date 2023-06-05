import { MakeModalsType } from "~/renderer/modals/types";
import MODAL_ETH_STAKE from "./StakeFlowModal";
import MODAL_EDIT_TRANSACTION from "./EditTransactionModal";
import { Account, AccountLike } from "@ledgerhq/types-live";
import { TransactionRaw as EthereumTransactionRaw } from "@ledgerhq/live-common/families/ethereum/types";

export type ModalsData = {
  MODAL_ETH_STAKE: {
    account: Account;
    checkbox?: boolean;
    singleProviderRedirectMode?: boolean;
    source?: string;
  };
  MODAL_EDIT_TRANSACTION: {
    account: AccountLike | undefined | null;
    parentAccount: Account | undefined | null;
    transactionRaw: EthereumTransactionRaw;
    transactionHash: string;
    isNftOperation: boolean;
  };
};

const modals: MakeModalsType<ModalsData> = {
  MODAL_ETH_STAKE,
  MODAL_EDIT_TRANSACTION,
};

export default modals;
