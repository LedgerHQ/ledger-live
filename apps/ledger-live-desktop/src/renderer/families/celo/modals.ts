import MODAL_CELO_REWARDS_INFO from "./EarnRewardsInfoModal/EarnRewardsInfoModal";
import MODAL_CELO_MANAGE from "./ManageModal/ManageModal";
import MODAL_CELO_LOCK from "./LockFlowModal";
import MODAL_CELO_UNLOCK from "./UnlockFlowModal";
import MODAL_CELO_VOTE from "./VoteFlowModal";
import MODAL_CELO_SIMPLE_OPERATION from "./SimpleOperationFlowModal/SimpleOperationFlowModal";
import MODAL_CELO_WITHDRAW from "./WithdrawFlowModal";
import MODAL_CELO_ACTIVATE from "./ActivateFlowModal";
import MODAL_CELO_REVOKE from "./RevokeFlowModal";
import { MakeModalsType } from "~/renderer/modals/types";

export type ModalsData = {
  MODAL_CELO_REWARDS_INFO: undefined; // FIXME type me
  MODAL_CELO_MANAGE: undefined; // FIXME type me
  MODAL_CELO_LOCK: undefined; // FIXME type me
  MODAL_CELO_UNLOCK: undefined; // FIXME type me
  MODAL_CELO_VOTE: undefined; // FIXME type me
  MODAL_CELO_SIMPLE_OPERATION: undefined; // FIXME type me
  MODAL_CELO_WITHDRAW: undefined; // FIXME type me
  MODAL_CELO_ACTIVATE: undefined; // FIXME type me
  MODAL_CELO_REVOKE: undefined; // FIXME type me
};

const modals: MakeModalsType<ModalsData> = {
  MODAL_CELO_REWARDS_INFO,
  MODAL_CELO_MANAGE,
  MODAL_CELO_LOCK,
  MODAL_CELO_UNLOCK,
  MODAL_CELO_VOTE,
  MODAL_CELO_SIMPLE_OPERATION,
  MODAL_CELO_WITHDRAW,
  MODAL_CELO_ACTIVATE,
  MODAL_CELO_REVOKE,
};

export default modals;
