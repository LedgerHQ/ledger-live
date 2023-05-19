import MODAL_SOLANA_REWARDS_INFO, { Props as RewardsInfoProps } from "./DelegationFlowModal/Info";
import MODAL_SOLANA_DELEGATE from "./DelegationFlowModal";
import { Data as DelegationProps } from "./DelegationFlowModal/Body";
import MODAL_SOLANA_DELEGATION_ACTIVATE from "./DelegationActivateFlowModal";
import { Data as DelegationActivateProps } from "./DelegationActivateFlowModal/Body";
import MODAL_SOLANA_DELEGATION_DEACTIVATE from "./DelegationDeactivateFlowModal";
import { Data as DelegationDeactivateProps } from "./DelegationDeactivateFlowModal/Body";
import MODAL_SOLANA_DELEGATION_REACTIVATE from "./DelegationReactivateFlowModal";
import { Data as DelegationReactivateProps } from "./DelegationReactivateFlowModal/Body";
import MODAL_SOLANA_DELEGATION_WITHDRAW from "./DelegationWithdrawFlowModal";
import { Data as DelegationWithdrawProps } from "./DelegationWithdrawFlowModal/Body";
import { MakeModalsType } from "~/renderer/modals/types";

export type DelegateModalName =
  | "MODAL_SOLANA_DELEGATION_ACTIVATE"
  | "MODAL_SOLANA_DELEGATION_DEACTIVATE"
  | "MODAL_SOLANA_DELEGATION_REACTIVATE"
  | "MODAL_SOLANA_DELEGATION_WITHDRAW";

export type ModalsData = {
  MODAL_SOLANA_REWARDS_INFO: RewardsInfoProps;
  MODAL_SOLANA_DELEGATE: DelegationProps;
  MODAL_SOLANA_DELEGATION_ACTIVATE: DelegationActivateProps;
  MODAL_SOLANA_DELEGATION_DEACTIVATE: DelegationDeactivateProps;
  MODAL_SOLANA_DELEGATION_REACTIVATE: DelegationReactivateProps;
  MODAL_SOLANA_DELEGATION_WITHDRAW: DelegationWithdrawProps;
};

const modals: MakeModalsType<ModalsData> = {
  MODAL_SOLANA_REWARDS_INFO,
  MODAL_SOLANA_DELEGATE,
  MODAL_SOLANA_DELEGATION_ACTIVATE,
  MODAL_SOLANA_DELEGATION_DEACTIVATE,
  MODAL_SOLANA_DELEGATION_REACTIVATE,
  MODAL_SOLANA_DELEGATION_WITHDRAW,
};

export default modals;
