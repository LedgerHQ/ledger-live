import React from "react";
import Ellipsis from "~/renderer/components/Ellipsis";
import { useMaybeAccountName } from "~/renderer/reducers/wallet";
import type { AleoFamily } from "../../../types";
import StepSummaryAddressBadge from "./StepSummaryAddressBadge";

const StepSummaryFromAddress: NonNullable<AleoFamily["StepSummaryFromAddress"]> = ({
  account,
  parentAccount: _parentAccount,
  transaction,
}) => {
  const accountName = useMaybeAccountName(account);
  return (
    <>
      <Ellipsis ff="Inter" color="neutral.c100" fontSize={4}>
        {accountName}
      </Ellipsis>
      <StepSummaryAddressBadge transaction={transaction} direction="from" />
    </>
  );
};

export default StepSummaryFromAddress;
