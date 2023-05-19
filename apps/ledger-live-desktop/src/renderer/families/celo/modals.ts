import MODAL_CELO_REWARDS_INFO, {
  Props as RewardsInfoProps,
} from "./EarnRewardsInfoModal/EarnRewardsInfoModal";
import MODAL_CELO_MANAGE, { Props as ManageProps } from "./ManageModal/ManageModal";
import MODAL_CELO_LOCK from "./LockFlowModal";
import { Data as LockProps } from "./LockFlowModal/Body";
import MODAL_CELO_UNLOCK from "./UnlockFlowModal";
import { Data as UnlockProps } from "./UnlockFlowModal/Body";
import MODAL_CELO_VOTE from "./VoteFlowModal";
import { Data as VoteProps } from "./VoteFlowModal/Body";
import MODAL_CELO_SIMPLE_OPERATION from "./SimpleOperationFlowModal/SimpleOperationFlowModal";
import { Data as SimpleOperationProps } from "./SimpleOperationFlowModal/Body";
import MODAL_CELO_WITHDRAW from "./WithdrawFlowModal";
import { Data as WithdrawProps } from "./WithdrawFlowModal/Body";
import MODAL_CELO_ACTIVATE from "./ActivateFlowModal";
import { Data as ActivateProps } from "./ActivateFlowModal/Body";
import MODAL_CELO_REVOKE from "./RevokeFlowModal";
import { Data as RevokeProps } from "./RevokeFlowModal/Body";
import { MakeModalsType } from "~/renderer/modals/types";

export type ModalActions = "MODAL_CELO_ACTIVATE" | "MODAL_CELO_REVOKE";

export type ModalsData = {
  MODAL_CELO_REWARDS_INFO: RewardsInfoProps;
  MODAL_CELO_MANAGE: ManageProps;
  MODAL_CELO_LOCK: LockProps;
  MODAL_CELO_UNLOCK: UnlockProps;
  MODAL_CELO_VOTE: VoteProps;
  MODAL_CELO_SIMPLE_OPERATION: SimpleOperationProps;
  MODAL_CELO_WITHDRAW: WithdrawProps;
  MODAL_CELO_ACTIVATE: ActivateProps;
  MODAL_CELO_REVOKE: RevokeProps;
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
