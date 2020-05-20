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
    IN: OperationStatusIconReceive,
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
  };

  const Icon = IconsComponent[type] || OperationStatusIconSend;
  return <Icon size={size} confirmed={confirmed} failed={failed} type={type} />;
};
