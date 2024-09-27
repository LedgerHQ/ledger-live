import MODAL_MULTIVERSX_DELEGATE from "./components/Modals/Delegate";
import { Data as DelegateData } from "./components/Modals/Delegate/Body";
import MODAL_MULTIVERSX_REWARDS_INFO, {
  Props as RewardsInfoProps,
} from "./components/Modals/Delegate/Info";
import MODAL_MULTIVERSX_UNDELEGATE from "./components/Modals/Undelegate";
import { Data as UndelegateData } from "./components/Modals/Undelegate/Body";
import MODAL_MULTIVERSX_CLAIM_REWARDS from "./components/Modals/Claim";
import { Data as ClaimData } from "./components/Modals/Claim/Body";
import MODAL_MULTIVERSX_WITHDRAW from "./components/Modals/Withdraw";
import { Data as WithdrawData } from "./components/Modals/Withdraw/Body";
import { MakeModalsType } from "~/renderer/modals/types";

export type ModalsData = {
  MODAL_MULTIVERSX_DELEGATE: DelegateData;
  MODAL_MULTIVERSX_REWARDS_INFO: RewardsInfoProps;
  MODAL_MULTIVERSX_UNDELEGATE: UndelegateData;
  MODAL_MULTIVERSX_CLAIM_REWARDS: ClaimData;
  MODAL_MULTIVERSX_WITHDRAW: WithdrawData;
};

const mods: MakeModalsType<ModalsData> = {
  MODAL_MULTIVERSX_DELEGATE,
  MODAL_MULTIVERSX_REWARDS_INFO,
  MODAL_MULTIVERSX_UNDELEGATE,
  MODAL_MULTIVERSX_CLAIM_REWARDS,
  MODAL_MULTIVERSX_WITHDRAW,
};

export default mods;
