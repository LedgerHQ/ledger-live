import { MakeModalsType } from "~/renderer/modals/types";
import MODAL_ICP_LIST_NEURONS, {
  Props as MODAL_ICP_LIST_NEURONS_PROPS,
} from "./ManageNeuronFlowModal";
import MODAL_ICP_REFRESH_VOTING_POWER, {
  Props as MODAL_ICP_REFRESH_VOTING_POWER_PROPS,
} from "./RefreshVotingPowerFlowModal";

export type DelegationActionsModalName =
  | "MODAL_ICP_LIST_NEURONS"
  | "MODAL_ICP_REFRESH_VOTING_POWER";

export type ModalsData = {
  MODAL_ICP_LIST_NEURONS: MODAL_ICP_LIST_NEURONS_PROPS;
  MODAL_ICP_REFRESH_VOTING_POWER: MODAL_ICP_REFRESH_VOTING_POWER_PROPS;
};

const modals: MakeModalsType<ModalsData> = {
  MODAL_ICP_LIST_NEURONS,
  MODAL_ICP_REFRESH_VOTING_POWER,
};

export default modals;
