// @flow

import React from "react";
import OperationStatusWrapper from "./Wrapper";
import IconUndelegate from "../Undelegate";

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
      Icon={IconUndelegate}
      confirmed={confirmed}
      failed={failed}
    />
  );
};
