import type { OperationType } from "@ledgerhq/live-common/types/index";
import React from "react";
import OperationStatusWrapper from "./Wrapper";
import IconFees from "../Fees";

export default function Fees({
  confirmed,
  failed,
  size = 24,
  type,
}: {
  confirmed?: boolean,
  failed?: boolean,
  size?: number,
  type: OperationType,
}) {
  return (
    <OperationStatusWrapper
      size={size}
      Icon={IconFees}
      confirmed={confirmed}
      failed={failed}
      type={type}
    />
  );
}
