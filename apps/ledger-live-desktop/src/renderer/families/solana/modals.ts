import MODAL_SOLANA_REWARDS_INFO from "./DelegationFlowModal/Info";
import MODAL_SOLANA_DELEGATE from "./DelegationFlowModal";
import MODAL_SOLANA_DELEGATION_ACTIVATE from "./DelegationActivateFlowModal";
import MODAL_SOLANA_DELEGATION_DEACTIVATE from "./DelegationDeactivateFlowModal";
import MODAL_SOLANA_DELEGATION_REACTIVATE from "./DelegationReactivateFlowModal";
import MODAL_SOLANA_DELEGATION_WITHDRAW from "./DelegationWithdrawFlowModal";
import { MakeModalsType } from "~/renderer/modals/types";

export type ModalsData = {
  MODAL_SOLANA_REWARDS_INFO: undefined; // FIXME type me
  MODAL_SOLANA_DELEGATE: undefined; // FIXME type me
  MODAL_SOLANA_DELEGATION_ACTIVATE: undefined; // FIXME type me
  MODAL_SOLANA_DELEGATION_DEACTIVATE: undefined; // FIXME type me
  MODAL_SOLANA_DELEGATION_REACTIVATE: undefined; // FIXME type me
  MODAL_SOLANA_DELEGATION_WITHDRAW: undefined; // FIXME type me
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
