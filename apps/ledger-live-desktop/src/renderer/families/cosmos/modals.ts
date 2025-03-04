import MODAL_COSMOS_DELEGATE from "./DelegationFlowModal";
import { Data as DelegationProps } from "./DelegationFlowModal/Body";
import MODAL_COMMON_DELEGATE from "./CommonDelegate";
import { Data as CommonDelegationProps } from "./CommonDelegate/Body";
import MODAL_COSMOS_REWARDS_INFO, { Props as RewardsInfoProps } from "./DelegationFlowModal/Info";
import MODAL_COSMOS_CLAIM_REWARDS from "./ClaimRewardsFlowModal";
import MODAL_COSMOS_MANAGE, { Props as ManageProps } from "./ManageModal/ManageModal";
import { Data as ClaimRewardsData } from "./ClaimRewardsFlowModal/Body";
import MODAL_COSMOS_REDELEGATE from "./RedelegationFlowModal";
import { Data as RedelegationData } from "./RedelegationFlowModal/Body";
import MODAL_COSMOS_UNDELEGATE from "./UndelegationFlowModal";
import { Data as UndelegationData } from "./UndelegationFlowModal/Body";
import { MakeModalsType } from "~/renderer/modals/types";

export type DelegationActionsModalName =
  | "MODAL_COSMOS_CLAIM_REWARDS"
  | "MODAL_COSMOS_REDELEGATE"
  | "MODAL_COSMOS_UNDELEGATE"
  | "MODAL_COSMOS_MANAGE"
  | "MODAL_COMMON_DELEGATE";

export type ModalsData = {
  MODAL_COSMOS_DELEGATE: DelegationProps;
  MODAL_COSMOS_REWARDS_INFO: RewardsInfoProps;
  MODAL_COSMOS_CLAIM_REWARDS: ClaimRewardsData;
  MODAL_COSMOS_REDELEGATE: RedelegationData;
  MODAL_COSMOS_UNDELEGATE: UndelegationData;
  MODAL_COSMOS_MANAGE: ManageProps;
  MODAL_COMMON_DELEGATE: CommonDelegationProps;
};

const modals: MakeModalsType<ModalsData> = {
  MODAL_COSMOS_DELEGATE,
  MODAL_COSMOS_REWARDS_INFO,
  MODAL_COSMOS_CLAIM_REWARDS,
  MODAL_COSMOS_REDELEGATE,
  MODAL_COSMOS_UNDELEGATE,
  MODAL_COSMOS_MANAGE,
  MODAL_COMMON_DELEGATE,
};

export default modals;
