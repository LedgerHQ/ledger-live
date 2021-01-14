// @flow
import type { OperationType } from "@ledgerhq/live-common/lib/types";
import React from "react";
import OperationStatusWrapper from "./Wrapper";
import IconDelegate from "../Delegate";

export default ({
  confirmed,
  failed,
  size = 24,
  type,
}: {
  confirmed?: boolean,
  failed?: boolean,
  size?: number,
  type: OperationType,
}) => (
  <OperationStatusWrapper
    size={size}
    Icon={IconDelegate}
    confirmed={confirmed}
    failed={failed}
    type={type}
  />
);
