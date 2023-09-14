import { getTransactionByHash } from "@ledgerhq/coin-evm/api/transaction/index";
import { getEstimatedFees } from "@ledgerhq/coin-evm/logic";
import { getMainAccount } from "@ledgerhq/live-common/account/index";
import { getMinFees } from "@ledgerhq/live-common/families/evm/getUpdateTransactionPatch";
import BigNumber from "bignumber.js";
import React, { Fragment, memo, useState } from "react";
import { Trans } from "react-i18next";
import Alert from "~/renderer/components/Alert";
import Box from "~/renderer/components/Box";
import Button from "~/renderer/components/Button";
import CurrencyDownStatusAlert from "~/renderer/components/CurrencyDownStatusAlert";
import logger from "~/renderer/logger";
import SendAmountFields from "../../../../modals/Send/SendAmountFields";
import { TransactionErrorBanner } from "../components/TransactionErrorBanner";
import { StepProps } from "../types";

const ONE_WEI_IN_GWEI = 1_000_000_000;

const StepFees = ({
  account,
  parentAccount,
  transaction,
  transactionToUpdate,
  status,
  bridgePending,
  t,
  onChangeTransaction,
  updateTransaction,
}: StepProps) => {
  const mainAccount = account ? getMainAccount(account, parentAccount) : null;

  if (!mainAccount || !transaction || !transactionToUpdate) {
    return null;
  }

  const feeValue = getEstimatedFees(transactionToUpdate).div(
    new BigNumber(10).pow(mainAccount.unit.magnitude),
  );

  // log fees info
  logger.log(`transactionToUpdate.maxFeePerGas: ${transactionToUpdate.maxFeePerGas?.toFixed(0)}`);
  logger.log(`transactionToUpdate.gasPrice: ${transactionToUpdate.gasPrice?.toFixed(0)}`);
  logger.log(
    `transactionToUpdate.maxPriorityFeePerGas: ${transactionToUpdate.maxPriorityFeePerGas?.toFixed(
      0,
    )}`,
  );

  let maxPriorityFeePerGasinGwei, maxFeePerGasinGwei, maxGasPriceinGwei;
  if (transactionToUpdate.type === 2) {
    // convert from wei to gwei
    /**
     * FIXME: should not be done here but through usage of FormattedVal component
     * for display, cf. FIXME bellow
     */
    maxPriorityFeePerGasinGwei = transactionToUpdate.maxPriorityFeePerGas
      .dividedBy(ONE_WEI_IN_GWEI)
      .toFixed(0);
    maxFeePerGasinGwei = transactionToUpdate.maxFeePerGas.dividedBy(ONE_WEI_IN_GWEI).toFixed(0);
  } else {
    maxGasPriceinGwei = transactionToUpdate.gasPrice.dividedBy(ONE_WEI_IN_GWEI).toFixed(0);
  }

  return (
    <Box flow={4}>
      <CurrencyDownStatusAlert currencies={[mainAccount.currency]} />
      {account && (
        <Fragment key={account.id}>
          <SendAmountFields
            account={mainAccount}
            parentAccount={parentAccount}
            status={status}
            transaction={transaction}
            onChange={onChangeTransaction}
            bridgePending={bridgePending}
            updateTransaction={updateTransaction}
            minFees={getMinFees({ transaction: transactionToUpdate })}
          />
        </Fragment>
      )}
      {/* FIXME: this whole UI bit displaying pending tx fees info should be
      it's own independant dumb react ui component */}
      <Alert type="primary">
        {/* FIXME: fix i18n (value as param for propper formatting) */}
        {/* FIXME: use FormattedVal src/renderer/components/FormattedVal.tsx component to display fees related values
          cf. usage in src/renderer/drawers/OperationDetails/index.tsx
        */}
        {transactionToUpdate.type === 2 ? ( // Display the fees info of the pending transaction (network fee, maxPriorityFeePerGas, maxFeePerGas, maxGasPrice)
          <ul style={{ marginLeft: "5px" }}>
            {t("operation.edit.previousFeesInfo.pendingTransactionFeesInfo")}
            <li>{`${t("operation.edit.previousFeesInfo.networkfee")} ${feeValue} ${
              mainAccount.currency.ticker
            }`}</li>
            <li>{`${t(
              "operation.edit.previousFeesInfo.maxPriorityFee",
            )} ${maxPriorityFeePerGasinGwei} Gwei`}</li>
            <li>{`${t("operation.edit.previousFeesInfo.maxFee")} ${maxFeePerGasinGwei} Gwei`}</li>
          </ul>
        ) : (
          <ul style={{ marginLeft: "5px" }}>
            {t("operation.edit.previousFeesInfo.pendingTransactionFeesInfo")}
            <li>{`${t("operation.edit.previousFeesInfo.networkfee")} ${feeValue} ${
              mainAccount.currency.ticker
            }`}</li>
            <li>{`${t("operation.edit.previousFeesInfo.gasPrice")} ${maxGasPriceinGwei} Gwei`}</li>
          </ul>
        )}
      </Alert>
    </Box>
  );
};

export const StepFeesFooter = ({
  account,
  parentAccount,
  transaction,
  transactionHash,
  bridgePending,
  status,
  transitionTo,
}: StepProps) => {
  const [transactionHasBeenValidated, setTransactionHasBeenValidated] = useState(false);

  const onClick = async () => {
    transitionTo("summary");
  };

  if (!account || !transaction || !transactionHash) {
    return null;
  }

  const mainAccount = getMainAccount(account, parentAccount);

  getTransactionByHash(mainAccount.currency, transactionHash).then(tx => {
    if (tx?.confirmations) {
      setTransactionHasBeenValidated(true);
    }
  });

  const { errors } = status;
  const errorCount = Object.keys(errors).length;

  return (
    <>
      <TransactionErrorBanner
        transactionHasBeenValidated={transactionHasBeenValidated}
        errors={errors}
      />
      <Button
        id={"send-amount-continue-button"}
        isLoading={bridgePending}
        primary
        disabled={transactionHasBeenValidated || bridgePending || errorCount}
        onClick={onClick}
      >
        <Trans i18nKey="common.continue" />
      </Button>
    </>
  );
};

export default memo<StepProps>(StepFees);
