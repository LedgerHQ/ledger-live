import MODAL_ELROND_DELEGATE from "./components/Modals/Delegate";
import { Data as DelegateData } from "./components/Modals/Delegate/Body";
import MODAL_ELROND_REWARDS_INFO, {
  Props as RewardsInfoProps,
} from "./components/Modals/Delegate/Info";
import MODAL_ELROND_UNDELEGATE from "./components/Modals/Undelegate";
import { Data as UndelegateData } from "./components/Modals/Undelegate/Body";
import MODAL_ELROND_CLAIM_REWARDS from "./components/Modals/Claim";
import { Data as ClaimData } from "./components/Modals/Claim/Body";
import MODAL_ELROND_WITHDRAW from "./components/Modals/Withdraw";
import { Data as WithdrawData } from "./components/Modals/Withdraw/Body";
import { MakeModalsType } from "~/renderer/modals/types";

export type ModalsData = {
  MODAL_ELROND_DELEGATE: DelegateData;
  MODAL_ELROND_REWARDS_INFO: RewardsInfoProps;
  MODAL_ELROND_UNDELEGATE: UndelegateData;
  MODAL_ELROND_CLAIM_REWARDS: ClaimData;
  MODAL_ELROND_WITHDRAW: WithdrawData;
};

const mods: MakeModalsType<ModalsData> = {
  MODAL_ELROND_DELEGATE,
  MODAL_ELROND_REWARDS_INFO,
  MODAL_ELROND_UNDELEGATE,
  MODAL_ELROND_CLAIM_REWARDS,
  MODAL_ELROND_WITHDRAW,
};

export default mods;
