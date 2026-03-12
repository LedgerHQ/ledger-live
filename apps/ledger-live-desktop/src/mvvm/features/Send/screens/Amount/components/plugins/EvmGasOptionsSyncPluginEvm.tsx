import React from "react";
import { Banner } from "@ledgerhq/lumen-ui-react";
import { useTranslation } from "react-i18next";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import type { Transaction as EvmTransaction, GasOptions } from "@ledgerhq/coin-evm/types/index";
import type { SendFlowTransactionActions } from "@ledgerhq/live-common/flows/send/types";
import { EvmGasOptionsSync } from "../Fees/EvmGasOptionsSync";

type Props = Readonly<{
  account: AccountLike;
  parentAccount: Account | null;
  transaction: EvmTransaction;
  transactionActions: SendFlowTransactionActions;
  evmGasOptions: GasOptions | undefined;
  gasOptionsError: Error | undefined;
  gasOptionsLoading: boolean;
}>;

export function EvmGasOptionsSyncPluginEvm({
  account,
  parentAccount,
  transaction,
  transactionActions,
  evmGasOptions,
  gasOptionsError,
  gasOptionsLoading,
}: Props) {
  const { t } = useTranslation();

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
