import { MakeModalsType } from "~/renderer/modals/types";
import MODAL_NEAR_STAKE from "./StakingFlowModal";
import MODAL_NEAR_REWARDS_INFO from "./StakingFlowModal/Info";
import MODAL_NEAR_UNSTAKE from "./UnstakingFlowModal";
import MODAL_NEAR_WITHDRAW from "./WithdrawingFlowModal";

export type ModalsData = {
  MODAL_NEAR_STAKE: undefined; // FIXME type me
  MODAL_NEAR_REWARDS_INFO: undefined; // FIXME type me
  MODAL_NEAR_UNSTAKE: undefined; // FIXME type me
  MODAL_NEAR_WITHDRAW: undefined; // FIXME type me
};

const modals: MakeModalsType<ModalsData> = {
  MODAL_NEAR_STAKE,
  MODAL_NEAR_REWARDS_INFO,
  MODAL_NEAR_UNSTAKE,
  MODAL_NEAR_WITHDRAW,
};

export default modals;
