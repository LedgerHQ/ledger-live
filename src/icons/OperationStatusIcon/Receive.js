// @flow

import React from "react";
import OperationStatusWrapper from "./Wrapper";
import IconReceive from "../Receive";

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
      Icon={IconReceive}
      income
      confirmed={confirmed}
      failed={failed}
    />
  );
};
