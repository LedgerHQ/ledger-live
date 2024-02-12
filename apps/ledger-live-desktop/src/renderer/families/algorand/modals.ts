import { MakeModalsType } from "~/renderer/modals/types";
import MODAL_ALGORAND_OPT_IN from "./OptInFlowModal";
import MODAL_ALGORAND_CLAIM_REWARDS from "./Rewards/ClaimRewardsFlowModal";
import MODAL_ALGORAND_EARN_REWARDS_INFO, {
  Props as EarnRewardsInfoModalProps,
} from "./Rewards/EarnRewardsInfoModal";
import { Data as OptinFlowModalData } from "./OptInFlowModal/Body";
import { Data as ClaimRewardsData } from "./Rewards/ClaimRewardsFlowModal/Body";

export type ModalsData = {
  MODAL_ALGORAND_OPT_IN: OptinFlowModalData;
  MODAL_ALGORAND_CLAIM_REWARDS: ClaimRewardsData;
  MODAL_ALGORAND_EARN_REWARDS_INFO: EarnRewardsInfoModalProps;
};

const modals: MakeModalsType<ModalsData> = {
  MODAL_ALGORAND_OPT_IN,
  MODAL_ALGORAND_CLAIM_REWARDS,
  MODAL_ALGORAND_EARN_REWARDS_INFO,
};

export default modals;
