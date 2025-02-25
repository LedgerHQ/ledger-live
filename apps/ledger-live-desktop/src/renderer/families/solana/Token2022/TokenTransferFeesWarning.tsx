import React, { useMemo } from "react";
import BigNumber from "bignumber.js";
import { Trans } from "react-i18next";
import { formatCurrencyUnit } from "@ledgerhq/coin-framework/currencies/index";
import { Transaction, SolanaTokenAccount } from "@ledgerhq/live-common/families/solana/types";
import Alert from "~/renderer/components/Alert";

type Props = {
  tokenAccount: SolanaTokenAccount;
  transaction: Transaction;
};

export default function TokenTransferFeesWarning({ transaction, tokenAccount }: Props) {
  const transferFees =
    transaction.model.commandDescriptor?.command.kind === "token.transfer"
      ? transaction.model.commandDescriptor.command.extensions?.transferFee
      : undefined;

  const values = useMemo(() => {
    return transferFees
      ? {
          feePercent: transferFees.feePercent,
          feeBps: transferFees.feeBps,
          maxFee: formatCurrencyUnit(
            tokenAccount.token.units[0],
            new BigNumber(transferFees.maxTransferFee),
            {
              disableRounding: true,
              alwaysShowSign: false,
              showCode: true,
            },
          ),
        }
      : undefined;
  }, [tokenAccount.token.units, transferFees]);

  if (!transferFees || transferFees.feeBps === 0) return null;

  return (
    <div>
      <Alert>
        <Trans i18nKey="solana.token.transferFees.feesPercentHint" values={values} />
      </Alert>
    </div>
  );
}
