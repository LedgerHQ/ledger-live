// @flow

import React from "react";
import OperationStatusWrapper from "./Wrapper";
import Unfreeze from "../Unfreeze";

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
      Icon={Unfreeze}
      confirmed={confirmed}
      failed={failed}
    />
  );
};
