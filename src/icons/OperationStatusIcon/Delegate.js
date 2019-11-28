// @flow

import React from "react";
import OperationStatusWrapper from "./Wrapper";
import IconDelegate from "../Delegate";

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
      Icon={IconDelegate}
      confirmed={confirmed}
      failed={failed}
    />
  );
};
