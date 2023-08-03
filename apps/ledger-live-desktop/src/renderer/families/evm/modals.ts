import { MakeModalsType } from "~/renderer/modals/types";
import MODAL_EVM_STAKE from "./StakeFlowModal";
import { EditTransactionModal, EditTransactionModalProps } from "./EditTransaction/Modal";
import { Account } from "@ledgerhq/types-live";

export type ModalsData = {
  MODAL_EVM_STAKE: {
    account: Account;
    hasCheckbox?: boolean;
    singleProviderRedirectMode?: boolean;
    source?: string;
  };
  MODAL_EVM_EDIT_TRANSACTION: EditTransactionModalProps;
};

const modals: MakeModalsType<ModalsData> = {
  MODAL_EVM_STAKE,
  MODAL_EVM_EDIT_TRANSACTION: EditTransactionModal,
};

export default modals;
