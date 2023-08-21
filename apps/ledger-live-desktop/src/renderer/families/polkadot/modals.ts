import MODAL_POLKADOT_MANAGE from "./ManageModal";
import MODAL_POLKADOT_REWARDS_INFO from "./EarnRewardsInfoModal";
import MODAL_POLKADOT_SIMPLE_OPERATION from "./SimpleOperationFlowModal";
import { Data as SimpleOperationData } from "./SimpleOperationFlowModal/Body";
import MODAL_POLKADOT_NOMINATE from "./NominationFlowModal";
import { Data as NominateProps } from "./NominationFlowModal/Body";
import MODAL_POLKADOT_BOND from "./BondFlowModal";
import { Data as BondProps } from "./BondFlowModal/Body";
import MODAL_POLKADOT_UNBOND from "./UnbondFlowModal";
import { Data as UnbondProps } from "./UnbondFlowModal/Body";
import MODAL_POLKADOT_REBOND from "./RebondFlowModal";
import { Data as RebondProps } from "./RebondFlowModal/Body";
import { MakeModalsType } from "~/renderer/modals/types";
import { PolkadotAccount } from "@ledgerhq/live-common/families/polkadot/types";

export type ModalsData = {
  MODAL_POLKADOT_MANAGE: {
    account: PolkadotAccount;
    source: string;
  };
  MODAL_POLKADOT_REWARDS_INFO: {
    account: PolkadotAccount;
  };
  MODAL_POLKADOT_SIMPLE_OPERATION: SimpleOperationData;
  MODAL_POLKADOT_NOMINATE: NominateProps;
  MODAL_POLKADOT_BOND: BondProps;
  MODAL_POLKADOT_UNBOND: UnbondProps;
  MODAL_POLKADOT_REBOND: RebondProps;
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
