import MODAL_DELEGATE from "./DelegateFlowModal";
import { Data as DelegateProps } from "./DelegateFlowModal/Body";
import MODAL_TEZOS_EARNING_CHOICE from "./EarningChoiceModal";
import { Data as EarningChoiceProps } from "./EarningChoiceModal/Body";
import MODAL_TEZOS_STAKE from "./StakeFlowModal";
import { Data as TezosStakeProps } from "./StakeFlowModal/Body";
import MODAL_TEZOS_UNSTAKE from "./UnstakeFlowModal";
import { Data as UnstakeProps } from "./UnstakeFlowModal/Body";
import MODAL_TEZOS_UNSTAKE_REQUIRED, { Data as UnstakeRequiredProps } from "./UnstakeRequiredModal";
import { MakeModalsType } from "../../modals/types";

export type ModalsData = {
  MODAL_DELEGATE: DelegateProps;
  MODAL_TEZOS_EARNING_CHOICE: EarningChoiceProps;
  MODAL_TEZOS_STAKE: TezosStakeProps;
  MODAL_TEZOS_UNSTAKE: UnstakeProps;
  MODAL_TEZOS_UNSTAKE_REQUIRED: UnstakeRequiredProps;
};

const modals: MakeModalsType<ModalsData> = {
  MODAL_DELEGATE,
  MODAL_TEZOS_EARNING_CHOICE,
  MODAL_TEZOS_STAKE,
  MODAL_TEZOS_UNSTAKE,
  MODAL_TEZOS_UNSTAKE_REQUIRED,
};

export default modals;
