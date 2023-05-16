import MODAL_POLKADOT_MANAGE from "./ManageModal";
import MODAL_POLKADOT_REWARDS_INFO from "./EarnRewardsInfoModal";
import MODAL_POLKADOT_SIMPLE_OPERATION from "./SimpleOperationFlowModal";
import MODAL_POLKADOT_NOMINATE from "./NominationFlowModal";
import MODAL_POLKADOT_BOND from "./BondFlowModal";
import MODAL_POLKADOT_UNBOND from "./UnbondFlowModal";
import MODAL_POLKADOT_REBOND from "./RebondFlowModal";
import { MakeModalsType } from "~/renderer/modals/types";

export type ModalsData = {
  MODAL_POLKADOT_MANAGE: undefined; // FIXME type me
  MODAL_POLKADOT_REWARDS_INFO: undefined; // FIXME type me
  MODAL_POLKADOT_SIMPLE_OPERATION: undefined; // FIXME type me
  MODAL_POLKADOT_NOMINATE: undefined; // FIXME type me
  MODAL_POLKADOT_BOND: undefined; // FIXME type me
  MODAL_POLKADOT_UNBOND: undefined; // FIXME type me
  MODAL_POLKADOT_REBOND: undefined; // FIXME type me
};

const modals: MakeModalsType<ModalsData> = {
  MODAL_POLKADOT_MANAGE,
  MODAL_POLKADOT_REWARDS_INFO,
  MODAL_POLKADOT_SIMPLE_OPERATION,
  MODAL_POLKADOT_NOMINATE,
  MODAL_POLKADOT_BOND,
  MODAL_POLKADOT_UNBOND,
  MODAL_POLKADOT_REBOND,
};

export default modals;
