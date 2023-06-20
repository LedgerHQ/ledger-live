import { MakeModalsType } from "~/renderer/modals/types";
import MODAL_ETH_STAKE from "./StakeFlowModal";
import MODAL_EDIT_TRANSACTION, { Props as EditTransactionProps } from "./EditTransactionModal";
import { Account } from "@ledgerhq/types-live";

export type ModalsData = {
  MODAL_ETH_STAKE: {
    account: Account;
    checkbox?: boolean;
    singleProviderRedirectMode?: boolean;
    source?: string;
  };
  MODAL_EDIT_TRANSACTION: EditTransactionProps;
};

const modals: MakeModalsType<ModalsData> = {
  MODAL_ETH_STAKE,
  MODAL_EDIT_TRANSACTION,
};

export default modals;
