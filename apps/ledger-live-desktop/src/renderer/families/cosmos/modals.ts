import MODAL_COSMOS_DELEGATE from "./DelegationFlowModal";
import { Data as DelegationProps } from "./DelegationFlowModal/Body";
import MODAL_COSMOS_REWARDS_INFO, { Props as RewardsInfoProps } from "./DelegationFlowModal/Info";
import MODAL_COSMOS_CLAIM_REWARDS from "./ClaimRewardsFlowModal";
import { Data as ClaimRewardsData } from "./ClaimRewardsFlowModal/Body";
import MODAL_COSMOS_REDELEGATE from "./RedelegationFlowModal";
import { Data as RedelegationData } from "./RedelegationFlowModal/Body";
import MODAL_COSMOS_UNDELEGATE from "./UndelegationFlowModal";
import { Data as UndelegationData } from "./UndelegationFlowModal/Body";
import { MakeModalsType } from "~/renderer/modals/types";

export type DelegationActionsModalName =
  | "MODAL_COSMOS_CLAIM_REWARDS"
  | "MODAL_COSMOS_REDELEGATE"
  | "MODAL_COSMOS_UNDELEGATE";

export type ModalsData = {
  MODAL_COSMOS_DELEGATE: DelegationProps;
  MODAL_COSMOS_REWARDS_INFO: RewardsInfoProps;
  MODAL_COSMOS_CLAIM_REWARDS: ClaimRewardsData;
  MODAL_COSMOS_REDELEGATE: RedelegationData;
  MODAL_COSMOS_UNDELEGATE: UndelegationData;
};

const modals: MakeModalsType<ModalsData> = {
  MODAL_COSMOS_DELEGATE,
  MODAL_COSMOS_REWARDS_INFO,
  MODAL_COSMOS_CLAIM_REWARDS,
  MODAL_COSMOS_REDELEGATE,
  MODAL_COSMOS_UNDELEGATE,
};

export default modals;
