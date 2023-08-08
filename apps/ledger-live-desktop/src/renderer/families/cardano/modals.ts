import MODAL_CARDANO_DELEGATE, { DelegationModalProps } from "./DelegationFlowModal";
import MODAL_CARDANO_UNDELEGATE, { UnDelegationModalProps } from "./UndelegateFlowModal";
import MODAL_CARDANO_REWARDS_INFO, {
  CardanoEarnRewardsInfoModalProps,
} from "./DelegationFlowModal/Info";

export type ModalsData = {
  MODAL_CARDANO_DELEGATE: DelegationModalProps;
  MODAL_CARDANO_UNDELEGATE: UnDelegationModalProps;
  MODAL_CARDANO_REWARDS_INFO: CardanoEarnRewardsInfoModalProps;
};

export default {
  MODAL_CARDANO_DELEGATE,
  MODAL_CARDANO_UNDELEGATE,
  MODAL_CARDANO_REWARDS_INFO,
};
