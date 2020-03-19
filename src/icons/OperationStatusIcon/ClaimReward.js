// @flow

import React from "react";
import OperationStatusWrapper from "./Wrapper";
import ClaimReward from "../ClaimReward";

export default ({
  confirmed,
  failed,
  size = 24,
}: {
  confirmed?: boolean,
  failed?: boolean,
  size?: number,
}) => {
  return (
    <OperationStatusWrapper
      size={size}
      Icon={ClaimReward}
      confirmed={confirmed}
      failed={failed}
    />
  );
};
