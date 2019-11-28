// @flow

import React from "react";
import OperationStatusWrapper from "./Wrapper";
import IconEye from "../Eye";

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
      Icon={IconEye}
      confirmed={confirmed}
      failed={failed}
    />
  );
};
