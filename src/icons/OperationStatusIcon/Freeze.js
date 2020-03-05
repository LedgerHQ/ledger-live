// @flow

import React from "react";
import OperationStatusWrapper from "./Wrapper";
import Freeze from "../Freeze";

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
      Icon={Freeze}
      confirmed={confirmed}
      failed={failed}
    />
  );
};
