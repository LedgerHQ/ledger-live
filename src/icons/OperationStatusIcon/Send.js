// @flow

import React from "react";
import OperationStatusWrapper from "./Wrapper";
import IconSend from "../Send";

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
      Icon={IconSend}
      confirmed={confirmed}
      failed={failed}
    />
  );
};
