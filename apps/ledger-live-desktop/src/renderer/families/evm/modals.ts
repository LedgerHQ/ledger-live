import { Account } from "@ledgerhq/types-live";
import { MakeModalsType } from "~/renderer/modals/types";
import { EditTransactionModal, EditTransactionModalProps } from "./EditTransaction/Modal";
import MODAL_EVM_STAKE from "./StakeModalVersionWrapper";
import MODAL_EVM_DEFI from "./DefiFlowModal";

export type ModalsData = {
  MODAL_EVM_STAKE: {
    account: Account;
    hasCheckbox?: boolean;
    singleProviderRedirectMode?: boolean;
    source?: string;
  };
  MODAL_EVM_EDIT_TRANSACTION: EditTransactionModalProps;
  MODAL_EVM_DEFI: {
    account: Account;
  };
};

const modals: MakeModalsType<ModalsData> = {
  MODAL_EVM_STAKE,
  MODAL_EVM_DEFI,
  MODAL_EVM_EDIT_TRANSACTION: EditTransactionModal,
};

export default modals;
