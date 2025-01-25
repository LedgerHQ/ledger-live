import { MakeModalsType } from "~/renderer/modals/types";
import { EditTransactionModal, EditTransactionModalProps } from "./EditTransaction/Modal";
import MODAL_EVM_STAKE from "./StakeModalVersionWrapper";
import { WalletAPIAccount } from "@ledgerhq/live-common/wallet-api/types";

export type ModalsData = {
  MODAL_EVM_STAKE: {
    account: WalletAPIAccount;
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
