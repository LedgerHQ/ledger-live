import React, { useMemo } from "react";
import { Trans } from "react-i18next";
import BigNumber from "bignumber.js";
import {
  Transaction,
  SolanaAccount,
  SolanaTokenAccount,
  TransferFeeCalculated,
} from "@ledgerhq/live-common/families/solana/types";
import { TokenAccount } from "@ledgerhq/types-live";
import { findSubAccountById, getMainAccount } from "@ledgerhq/live-common/account/index";
import Text from "~/renderer/components/Text";
import Box from "~/renderer/components/Box";
import { useAccountUnit } from "~/renderer/hooks/useAccountUnit";
import FormattedVal from "~/renderer/components/FormattedVal";
import CounterValue from "~/renderer/components/CounterValue";

type Account = SolanaAccount | SolanaTokenAccount | TokenAccount;

type Props = {
  account: Account;
  parentAccount: SolanaAccount | null | undefined;
  transaction: Transaction;
};

const StepSummaryAdditionalRows = ({ account, parentAccount, transaction }: Props) => {
  const mainAccount = getMainAccount(account, parentAccount);
  const tokenAccount = useMemo(
    () =>
      transaction.subAccountId
        ? (findSubAccountById(mainAccount, transaction.subAccountId) as SolanaTokenAccount)
        : undefined,
    [mainAccount, transaction.subAccountId],
  );

  const transferFees =
    transaction.model.commandDescriptor?.command.kind === "token.transfer"
      ? transaction.model.commandDescriptor.command.extensions?.transferFee
      : undefined;

  return (
    <>
      {!!(transferFees && transferFees.feeBps > 0 && tokenAccount) && (
        <TransferFeeAdditionalRows
          transferFees={transferFees}
          tokenAccount={tokenAccount}
          transaction={transaction}
        />
      )}
    </>
  );
};

function TransferFeeAdditionalRows({
  transferFees,
  tokenAccount,
}: {
  transferFees: TransferFeeCalculated;
  tokenAccount: SolanaTokenAccount;
  transaction: Transaction;
}) {
  const unit = useAccountUnit(tokenAccount);
  return (
    <>
      <Box horizontal justifyContent="space-between" alignItems="center" mt={10} mb={20}>
        <Text ff="Inter|Medium" color="palette.text.shade40" fontSize={4}>
          <Trans i18nKey="solana.token.transferFees.transferFeesLabel" />
        </Text>
        <Box>
          <FormattedVal
            color="palette.text.shade80"
            disableRounding
            unit={unit}
            alwaysShowValue
            val={new BigNumber(transferFees.transferFee)}
            fontSize={4}
            inline
            showCode
          />
          <Box textAlign="right">
            <CounterValue
              color="palette.text.shade60"
              fontSize={3}
              currency={tokenAccount.token}
              value={new BigNumber(transferFees.transferFee)}
              alwaysShowSign={false}
              alwaysShowValue
            />
          </Box>
        </Box>
      </Box>
    </>
  );
}

export default StepSummaryAdditionalRows;
