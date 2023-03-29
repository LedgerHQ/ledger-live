import MODAL_ELROND_DELEGATE from "./components/Modals/Delegate";
import MODAL_ELROND_REWARDS_INFO from "./components/Modals/Delegate/Info";
import MODAL_ELROND_UNDELEGATE from "./components/Modals/Undelegate";
import MODAL_ELROND_CLAIM_REWARDS from "./components/Modals/Claim";
import MODAL_ELROND_WITHDRAW from "./components/Modals/Withdraw";

export const modals = {
  rewards: "MODAL_ELROND_REWARDS_INFO",
  claim: "MODAL_ELROND_CLAIM_REWARDS",
  stake: "MODAL_ELROND_DELEGATE",
  unstake: "MODAL_ELROND_UNDELEGATE",
  withdraw: "MODAL_ELROND_WITHDRAW",
};

export default {
  MODAL_ELROND_DELEGATE,
  MODAL_ELROND_REWARDS_INFO,
  MODAL_ELROND_UNDELEGATE,
  MODAL_ELROND_CLAIM_REWARDS,
  MODAL_ELROND_WITHDRAW,
};
