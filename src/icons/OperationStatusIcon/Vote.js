// @flow

import React from "react";
import OperationStatusWrapper from "./Wrapper";
import Vote from "../Vote";

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
      Icon={Vote}
      confirmed={confirmed}
      failed={failed}
    />
  );
};
