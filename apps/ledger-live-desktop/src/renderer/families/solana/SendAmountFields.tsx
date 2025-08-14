import React, { useMemo } from "react";
import type { SolanaTokenAccount } from "@ledgerhq/live-common/families/solana/types";
import { findSubAccountById } from "@ledgerhq/coin-framework/account/helpers";
import TokenTransferFeesWarning from "./Token2022/TokenTransferFeesWarning";
import { SolanaFamily } from "./types";

/**
 * SendAmountFields
 *
 * This component warns users willing to send tokens with transfer
 * fees extensions, and dynamically displays the computed amount.
 */
const SendAmountFields: NonNullable<SolanaFamily["sendAmountFields"]>["component"] = ({
  account,
  transaction,
}) => {
  const tokenAccount = useMemo(
    () =>
      transaction.subAccountId
        ? (findSubAccountById(account, transaction.subAccountId) as SolanaTokenAccount)
        : undefined,
    [account, transaction.subAccountId],
  );

  return (
    <>
      {tokenAccount ? (
        <TokenTransferFeesWarning tokenAccount={tokenAccount} transaction={transaction} />
      ) : null}
    </>
  );
};

export default {
  component: SendAmountFields,
  fields: [],
};
