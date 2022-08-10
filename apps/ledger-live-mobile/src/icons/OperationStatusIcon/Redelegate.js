import type { OperationType } from "@ledgerhq/types-live";
import React from "react";
import OperationStatusWrapper from "./Wrapper";
import IconRedelegate from "../Redelegate";

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
    Icon={IconRedelegate}
    confirmed={confirmed}
    failed={failed}
    type={type}
  />
);
