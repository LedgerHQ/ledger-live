import React from "react";
import type { TokenAccount } from "@ledgerhq/types-live";
import Ellipsis from "~/renderer/components/Ellipsis";
import { useMaybeAccountName } from "~/renderer/reducers/wallet";
import type { AleoAccount, Transaction } from "@ledgerhq/live-common/families/aleo/types";
import StepSummaryAddressBadge from "./StepSummaryAddressBadge";

type Props = {
  account: AleoAccount | TokenAccount;
  transaction: Transaction;
};

const StepSummaryFromAddress = ({ account, transaction }: Props) => {
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
