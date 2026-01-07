import type { MakeModalsType } from "~/renderer/modals/types";
import MODAL_HEDERA_RECEIVE_WITH_ASSOCIATION from "./ReceiveWithAssociationModal";
import MODAL_HEDERA_DELEGATION from "./DelegationFlowModal";
import MODAL_HEDERA_UNDELEGATION from "./UndelegationFlowModal";
import MODAL_HEDERA_REDELEGATION from "./RedelegationFlowModal";
import MODAL_HEDERA_CLAIM_REWARDS from "./ClaimRewardsFlowModal";
import type { Data as ReceiveModalProps } from "./ReceiveWithAssociationModal/types";
import type { Data as DelegationProps } from "./DelegationFlowModal/Body";
import type { Data as UndelegationProps } from "./UndelegationFlowModal/Body";
import type { Data as RedelegationProps } from "./RedelegationFlowModal/Body";
import type { Data as ClaimRewardsProps } from "./ClaimRewardsFlowModal/Body";

export type DelegateModalName =
  | "MODAL_HEDERA_DELEGATION"
  | "MODAL_HEDERA_UNDELEGATION"
  | "MODAL_HEDERA_REDELEGATION"
  | "MODAL_HEDERA_CLAIM_REWARDS";

export type ModalsData = {
  MODAL_HEDERA_RECEIVE_WITH_ASSOCIATION: ReceiveModalProps;
  MODAL_HEDERA_DELEGATION: DelegationProps;
  MODAL_HEDERA_UNDELEGATION: UndelegationProps;
  MODAL_HEDERA_REDELEGATION: RedelegationProps;
  MODAL_HEDERA_CLAIM_REWARDS: ClaimRewardsProps;
};

const modals: MakeModalsType<ModalsData> = {
  MODAL_HEDERA_RECEIVE_WITH_ASSOCIATION,
  MODAL_HEDERA_DELEGATION,
  MODAL_HEDERA_UNDELEGATION,
  MODAL_HEDERA_REDELEGATION,
  MODAL_HEDERA_CLAIM_REWARDS,
} as const;

export default modals;
