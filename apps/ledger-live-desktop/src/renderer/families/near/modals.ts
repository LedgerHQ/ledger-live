import { MakeModalsType } from "~/renderer/modals/types";
import MODAL_NEAR_STAKE from "./StakingFlowModal";
import { Data as StakeProps } from "./StakingFlowModal/Body";
import MODAL_NEAR_REWARDS_INFO, { Props as RewardsProps } from "./StakingFlowModal/Info";
import MODAL_NEAR_UNSTAKE from "./UnstakingFlowModal";
import { Data as UnstakeProps } from "./UnstakingFlowModal/Body";
import MODAL_NEAR_WITHDRAW from "./WithdrawingFlowModal";
import { Data as WithdrawProps } from "./WithdrawingFlowModal/Body";

export type DelegateModalName = "MODAL_NEAR_UNSTAKE" | "MODAL_NEAR_WITHDRAW";

export type ModalsData = {
  MODAL_NEAR_STAKE: StakeProps;
  MODAL_NEAR_REWARDS_INFO: RewardsProps;
  MODAL_NEAR_UNSTAKE: UnstakeProps;
  MODAL_NEAR_WITHDRAW: WithdrawProps;
};

const modals: MakeModalsType<ModalsData> = {
  MODAL_NEAR_STAKE,
  MODAL_NEAR_REWARDS_INFO,
  MODAL_NEAR_UNSTAKE,
  MODAL_NEAR_WITHDRAW,
};

export default modals;
