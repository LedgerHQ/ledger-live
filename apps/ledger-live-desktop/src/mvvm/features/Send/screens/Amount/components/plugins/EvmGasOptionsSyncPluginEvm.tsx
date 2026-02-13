import React from "react";
import { Banner } from "@ledgerhq/lumen-ui-react";
import { useTranslation } from "react-i18next";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import type { Transaction as EvmTransaction } from "@ledgerhq/coin-evm/types/index";
import { getMainAccount } from "@ledgerhq/coin-framework/account/helpers";
import type { SendFlowTransactionActions } from "@ledgerhq/live-common/flows/send/types";
import { useGasOptions } from "@ledgerhq/live-common/families/evm/react";
import { EvmGasOptionsSync } from "../Fees/EvmGasOptionsSync";

type Props = Readonly<{
  account: AccountLike;
  parentAccount: Account | null;
  transaction: EvmTransaction;
  transactionActions: SendFlowTransactionActions;
}>;

export function EvmGasOptionsSyncPluginEvm({
  account,
  parentAccount,
  transaction,
  transactionActions,
}: Props) {
  const { t } = useTranslation();

  const mainAccount = getMainAccount(account, parentAccount ?? undefined);
  const gasOptionsInterval = mainAccount.currency.blockAvgTime
    ? mainAccount.currency.blockAvgTime * 1000
    : undefined;

  const [evmGasOptions, gasOptionsError, gasOptionsLoading] = useGasOptions({
    currency: mainAccount.currency,
    transaction,
    interval: gasOptionsInterval,
  });

  return (
    <>
      {gasOptionsError && !gasOptionsLoading ? (
        <Banner
          appearance="warning"
          title={t("newSendFlow.gasOptionsSync.warningTitle")}
          description={t("newSendFlow.gasOptionsSync.warningDescription")}
        />
      ) : null}
      <EvmGasOptionsSync
        account={account}
        parentAccount={parentAccount}
        transaction={transaction}
        transactionActions={transactionActions}
        evmGasOptions={evmGasOptions}
      />
    </>
  );
}
