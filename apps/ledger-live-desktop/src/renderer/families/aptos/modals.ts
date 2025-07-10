import { MakeModalsType } from "~/renderer/modals/types";
import MODAL_APTOS_STAKE from "./StakingFlowModal";
import { Data as StakeProps } from "./StakingFlowModal/Body";
import MODAL_APTOS_REWARDS_INFO, { Props as RewardsProps } from "./StakingFlowModal/Info";
import MODAL_APTOS_UNSTAKE from "./UnstakingFlowModal";
import { Data as UnstakeProps } from "./UnstakingFlowModal/Body";
import MODAL_APTOS_WITHDRAW from "./WithdrawingFlowModal";
import { Data as WithdrawProps } from "./WithdrawingFlowModal/Body";
import MODAL_APTOS_RESTAKE from "./RestakingFlowModal";
import { Data as RestakeProps } from "./RestakingFlowModal/Body";

export type DelegateModalName =
  | "MODAL_APTOS_UNSTAKE"
  | "MODAL_APTOS_WITHDRAW"
  | "MODAL_APTOS_RESTAKE";

export type ModalsData = {
  MODAL_APTOS_STAKE: StakeProps;
  MODAL_APTOS_REWARDS_INFO: RewardsProps;
  MODAL_APTOS_UNSTAKE: UnstakeProps;
  MODAL_APTOS_WITHDRAW: WithdrawProps;
  MODAL_APTOS_RESTAKE: RestakeProps;
};

const modals: MakeModalsType<ModalsData> = {
  MODAL_APTOS_STAKE,
  MODAL_APTOS_REWARDS_INFO,
  MODAL_APTOS_UNSTAKE,
  MODAL_APTOS_WITHDRAW,
  MODAL_APTOS_RESTAKE,
};

export default modals;
