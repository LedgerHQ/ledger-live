import { MakeModalsType } from "~/renderer/modals/types";
import MODAL_ALGORAND_OPT_IN from "./OptInFlowModal";
import MODAL_ALGORAND_CLAIM_REWARDS from "./Rewards/ClaimRewardsFlowModal";
import MODAL_ALGORAND_EARN_REWARDS_INFO from "./Rewards/EarnRewardsInfoModal";

export type ModalsData = {
  MODAL_ALGORAND_OPT_IN: undefined; // FIXME type me
  MODAL_ALGORAND_CLAIM_REWARDS: undefined; // FIXME type me
  MODAL_ALGORAND_EARN_REWARDS_INFO: undefined;
};

const modals: MakeModalsType<ModalsData> = {
  MODAL_ALGORAND_OPT_IN,
  MODAL_ALGORAND_CLAIM_REWARDS,
  MODAL_ALGORAND_EARN_REWARDS_INFO,
};

export default modals;
