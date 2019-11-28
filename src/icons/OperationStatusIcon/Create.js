// @flow

import React from "react";
import OperationStatusWrapper from "./Wrapper";
import IconCreate from "../Plus";

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
      Icon={IconCreate}
      confirmed={confirmed}
      failed={failed}
    />
  );
};
