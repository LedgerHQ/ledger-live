import { MakeModalsType } from "~/renderer/modals/types";
import { EditTransactionModal, EditTransactionModalProps } from "./EditTransaction/Modal";
import MODAL_EVM_STAKE from "./StakeFlowModal";
import { AccountLike } from "@ledgerhq/types-live";
import MODAL_EVM_DELEGATE from "./DelegationFlowModal";
import { Data as DelegationProps } from "./DelegationFlowModal/Body";
import MODAL_EVM_REWARDS_INFO, { Props as RewardsInfoProps } from "./DelegationFlowModal/Info";

export type ModalsData = {
  MODAL_EVM_STAKE: {
    account: AccountLike;
    hasCheckbox?: boolean;
    singleProviderRedirectMode?: boolean;
    source?: string;
  };
  MODAL_EVM_EDIT_TRANSACTION: EditTransactionModalProps;
  MODAL_EVM_DELEGATE: DelegationProps;
  MODAL_EVM_REWARDS_INFO: RewardsInfoProps;
};

const modals: MakeModalsType<ModalsData> = {
  MODAL_EVM_STAKE,
  MODAL_EVM_EDIT_TRANSACTION: EditTransactionModal,
  MODAL_EVM_DELEGATE,
  MODAL_EVM_REWARDS_INFO,
};

export default modals;
