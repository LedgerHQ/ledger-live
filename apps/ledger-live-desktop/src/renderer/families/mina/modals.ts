import { MakeModalsType } from "~/renderer/modals/types";
import MODAL_MINA_STAKE from "./StakingFlowModal";
import { Props as StakeProps } from "./StakingFlowModal";

export type ModalsData = {
  MODAL_MINA_STAKE: StakeProps;
};

const modals: MakeModalsType<ModalsData> = {
  MODAL_MINA_STAKE,
};

export default modals;
