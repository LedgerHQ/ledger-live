import MODAL_ICON_REWARDS_INFO, { Props as RewardsInfoProps } from "./EarnRewardsInfoModal";
import MODAL_ICON_FREEZE from "./Freeze";
import { Data as FreezeProps } from "./Freeze/Body";
import MODAL_MANAGE_ICON from "./ManageIcon";
import { Props as ManageProps } from "./ManageIcon";
import MODAL_VOTE_ICON from "./VoteIcon";
import { Data as VoteProps } from "./VoteIcon/Body";
import MODAL_VOTE_ICON_INFO from "./VoteIcon/Info";
import { Props as VoteInfoProps } from "./VoteIcon/Info/shared";
import MODAL_ICON_UNFREEZE from "./Unfreeze";
import { Data as UnFreezeProps } from "./Unfreeze/Body";
import MODAL_ICON_CLAIM_REWARDS from "./ClaimRewards";
import { Data as ClaimRewardsProps } from "./ClaimRewards/Body";
import { MakeModalsType } from "~/renderer/modals/types";

export type ModalsData = {
  MODAL_ICON_REWARDS_INFO: RewardsInfoProps;
  MODAL_MANAGE_ICON: ManageProps;
  MODAL_ICON_FREEZE: FreezeProps;
  MODAL_VOTE_ICON: VoteProps;
  MODAL_VOTE_ICON_INFO: VoteInfoProps;
  MODAL_ICON_UNFREEZE: UnFreezeProps;
  MODAL_ICON_CLAIM_REWARDS: ClaimRewardsProps;
};

const modals: MakeModalsType<ModalsData> = {
  MODAL_ICON_REWARDS_INFO,
  MODAL_MANAGE_ICON,
  MODAL_ICON_FREEZE,
  MODAL_VOTE_ICON,
  MODAL_VOTE_ICON_INFO,
  MODAL_ICON_UNFREEZE,
  MODAL_ICON_CLAIM_REWARDS,
};

export default modals;
