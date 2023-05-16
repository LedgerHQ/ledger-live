import MODAL_COSMOS_DELEGATE from "./DelegationFlowModal";
import MODAL_COSMOS_REWARDS_INFO from "./DelegationFlowModal/Info";
import MODAL_COSMOS_CLAIM_REWARDS from "./ClaimRewardsFlowModal";
import MODAL_COSMOS_REDELEGATE from "./RedelegationFlowModal";
import MODAL_COSMOS_UNDELEGATE from "./UndelegationFlowModal";
import { MakeModalsType } from "~/renderer/modals/types";

export type ModalsData = {
  MODAL_COSMOS_DELEGATE: undefined; // FIXME type me
  MODAL_COSMOS_REWARDS_INFO: undefined; // FIXME type me
  MODAL_COSMOS_CLAIM_REWARDS: undefined; // FIXME type me
  MODAL_COSMOS_REDELEGATE: undefined; // FIXME type me
  MODAL_COSMOS_UNDELEGATE: undefined; // FIXME type me
};

const modals: MakeModalsType<ModalsData> = {
  MODAL_COSMOS_DELEGATE,
  MODAL_COSMOS_REWARDS_INFO,
  MODAL_COSMOS_CLAIM_REWARDS,
  MODAL_COSMOS_REDELEGATE,
  MODAL_COSMOS_UNDELEGATE,
};

export default modals;
