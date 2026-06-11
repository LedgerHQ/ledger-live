import { AccountLike } from "@ledgerhq/types-live";
import { MakeModalsType } from "~/renderer/modals/types";
import MODAL_EVM_CLAIM_REWARDS from "./ClaimRewardsFlowModal";
import { Data as ClaimRewardsProps } from "./ClaimRewardsFlowModal/Body";
import MODAL_EVM_DELEGATE from "./DelegationFlowModal";
import { Data as DelegationProps } from "./DelegationFlowModal/Body";
import MODAL_EVM_REWARDS_INFO, { Props as RewardsInfoProps } from "./DelegationFlowModal/Info";
import { EditTransactionModal, EditTransactionModalProps } from "./EditTransaction/Modal";
import MODAL_EVM_STAKE from "./StakeFlowModal";
import MODAL_EVM_UNDELEGATE from "./UndelegationFlowModal";
import { Data as UndelegationProps } from "./UndelegationFlowModal/Body";
import MODAL_EVM_REDELEGATE from "./RedelegationFlowModal";
import { Data as RedelegationProps } from "./RedelegationFlowModal/Body";
import MODAL_EVM_WITHDRAW from "./WithdrawFlowModal";
import { Data as WithdrawProps } from "./WithdrawFlowModal/Body";

export type DelegationActionsModalName = "MODAL_EVM_REDELEGATE" | "MODAL_EVM_UNDELEGATE";

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
  MODAL_EVM_UNDELEGATE: UndelegationProps;
  MODAL_EVM_REDELEGATE: RedelegationProps;
  MODAL_EVM_WITHDRAW: WithdrawProps;
  MODAL_EVM_CLAIM_REWARDS: ClaimRewardsProps;
};

const modals: MakeModalsType<ModalsData> = {
  MODAL_EVM_STAKE,
  MODAL_EVM_EDIT_TRANSACTION: EditTransactionModal,
  MODAL_EVM_DELEGATE,
  MODAL_EVM_REWARDS_INFO,
  MODAL_EVM_UNDELEGATE,
  MODAL_EVM_REDELEGATE,
  MODAL_EVM_WITHDRAW,
  MODAL_EVM_CLAIM_REWARDS,
};

export default modals;
