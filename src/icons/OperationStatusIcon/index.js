// @flow

import type { OperationType } from "@ledgerhq/live-common/lib/types";
import React from "react";
import OperationStatusIconSend from "./Send";
import OperationStatusIconReceive from "./Receive";
import OperationStatusIconDelegate from "./Delegate";
import OperationStatusIconUndelegate from "./Undelegate";
import OperationStatusIconReveal from "./Reveal";
import OperationStatusIconCreate from "./Create";
import OperationStatusIconFreeze from "./Freeze";
import OperationStatusIconUnfreeze from "./Unfreeze";
import OperationStatusIconVote from "./Vote";
import OperationStatusIconClaimRewards from "./ClaimReward";
import OperationStatusIconRedelegate from "./Redelegate";
import OperationStatusIconFees from "./Fees";
import OperationStatusIconOptIn from "./OptIn";
import OperationStatusIconOptOut from "./OptOut";
import OperationStatusIconEnable from "./Enable";
import OperationStatusIconSupply from "./Supply";
import OperationStatusIconWithdraw from "./Withdraw";

export default ({
  type,
  confirmed,
  failed,
  size = 24,
}: {
  size?: number,
  type: OperationType,
  confirmed?: boolean,
  failed?: boolean,
}) => {
  const IconsComponent: { [_: OperationType]: * } = {
    OUT: OperationStatusIconSend,
    NFT_OUT: OperationStatusIconSend,
    IN: OperationStatusIconReceive,
    NFT_IN: OperationStatusIconReceive,
    DELEGATE: OperationStatusIconDelegate,
    UNDELEGATE: OperationStatusIconUndelegate,
    REDELEGATE: OperationStatusIconRedelegate,
    REVEAL: OperationStatusIconReveal,
    CREATE: OperationStatusIconCreate,
    NONE: OperationStatusIconSend,
    FREEZE: OperationStatusIconFreeze,
    UNFREEZE: OperationStatusIconUnfreeze,
    VOTE: OperationStatusIconVote,
    REWARD: OperationStatusIconClaimRewards,
    FEES: OperationStatusIconFees,
    OPT_IN: OperationStatusIconOptIn,
    OPT_OUT: OperationStatusIconOptOut,
    CLOSE_ACCOUNT: OperationStatusIconOptOut,
    REDEEM: OperationStatusIconWithdraw,
    SUPPLY: OperationStatusIconSupply,
    APPROVE: OperationStatusIconEnable,
  };

  const Icon = IconsComponent[type] || OperationStatusIconSend;
  return <Icon size={size} confirmed={confirmed} failed={failed} type={type} />;
};
