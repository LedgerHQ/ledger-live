import MODAL_SUI_DELEGATE from "./DelegationFlowModal";
import MODAL_SUI_UNSTAKE from "./UnstakingFlowModal";
import { Data as DelegationProps } from "./DelegationFlowModal/Body";
import { Data as UnstakeProps } from "./UnstakingFlowModal/Body";
import { MakeModalsType } from "~/renderer/modals/types";

export type DelegateModalName = "MODAL_SUI_DELEGATE" | "MODAL_SUI_UNSTAKE";

export type ModalsData = {
  MODAL_SUI_DELEGATE: DelegationProps;
  MODAL_SUI_UNSTAKE: UnstakeProps;
};

const modals: MakeModalsType<ModalsData> = {
  MODAL_SUI_DELEGATE,
  MODAL_SUI_UNSTAKE,
};

export default modals;
