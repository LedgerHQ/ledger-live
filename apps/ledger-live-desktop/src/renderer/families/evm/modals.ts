import { MakeModalsType } from "~/renderer/modals/types";
import MODAL_ETH_STAKE from "./StakeFlowModal";
import { EditTransactionModal, EditTransactionModalProps } from "./EditTransaction/Modal";
import { Account } from "@ledgerhq/types-live";

export type ModalsData = {
  MODAL_ETH_STAKE: {
    account: Account;
    hasCheckbox?: boolean;
    singleProviderRedirectMode?: boolean;
    source?: string;
  };
  MODAL_EDIT_TRANSACTION: EditTransactionModalProps;
};

const modals: MakeModalsType<ModalsData> = {
  MODAL_ETH_STAKE,
  MODAL_EDIT_TRANSACTION: EditTransactionModal,
};

export default modals;
