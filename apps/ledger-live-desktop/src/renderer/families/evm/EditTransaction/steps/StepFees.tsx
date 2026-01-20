import { getFormattedFeeFields } from "@ledgerhq/coin-evm/editTransaction/index";
import { getMainAccount } from "@ledgerhq/live-common/account/index";
import React, { memo } from "react";
import { useSelector } from "LLD/hooks/redux";
import BuyButton from "~/renderer/components/BuyButton";
import { SharedFooterContinueButton, SharedStepFees } from "~/renderer/components/SpeedUpCancel";
import logger from "~/renderer/logger";
import { SendAmountFieldsProps } from "~/renderer/modals/Send/SendAmountFields";
import { localeSelector } from "~/renderer/reducers/settings";
import { TransactionErrorBanner } from "../components/TransactionErrorBanner";
import { StepProps } from "../types";

/**
 * Since onChangeTransaction and updateTransaction are used by SendAmountFields,
 * which expect a generic Transaction type, we need to "generalize" the type
 * (going from specific (EvmTransaction) to generic (Transaction)) of these 2
 * functions
 */
type StepFeesProps = Omit<StepProps, "onChangeTransaction" | "updateTransaction"> & {
  onChangeTransaction: SendAmountFieldsProps["onChange"];
  updateTransaction: SendAmountFieldsProps["updateTransaction"];
};

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
}: StepFeesProps) => {
  const mainAccount = getMainAccount(account, parentAccount);
  const locale = useSelector(localeSelector);

  // log fees info
  logger.log(`transactionToUpdate.maxFeePerGas: ${transactionToUpdate.maxFeePerGas?.toFixed(0)}`);
  logger.log(`transactionToUpdate.gasPrice: ${transactionToUpdate.gasPrice?.toFixed(0)}`);
  logger.log(
    `transactionToUpdate.maxPriorityFeePerGas: ${transactionToUpdate.maxPriorityFeePerGas?.toFixed(
      0,
    )}`,
  );

  const {
    formattedFeeValue,
    formattedMaxPriorityFeePerGas,
    formattedMaxFeePerGas,
    formattedGasPrice,
  } = getFormattedFeeFields({ transaction: transactionToUpdate, mainAccount, locale });

  return (
    <SharedStepFees
      accountId={account.id}
      account={mainAccount}
      parentAccount={parentAccount}
      status={status}
      transaction={transaction}
      onChange={onChangeTransaction}
      updateTransaction={updateTransaction}
      bridgePending={bridgePending}
      transactionToUpdate={transactionToUpdate}
      pendingFeesInfoTitle={t("operation.edit.previousFeesInfo.pendingTransactionFeesInfo")}
      feeDetails={
        <>
          <li>{t("operation.edit.previousFeesInfo.networkfee", { amount: formattedFeeValue })}</li>
          {transactionToUpdate.type === 2 ? (
            <>
              <li>
                {t("operation.edit.previousFeesInfo.maxPriorityFee", {
                  amount: formattedMaxPriorityFeePerGas,
                })}
              </li>
              <li>
                {t("operation.edit.previousFeesInfo.maxFee", { amount: formattedMaxFeePerGas })}
              </li>
            </>
          ) : (
            <li>{t("operation.edit.previousFeesInfo.gasPrice", { amount: formattedGasPrice })}</li>
          )}
        </>
      }
    />
  );
};

export const StepFeesFooter = ({
  account,
  parentAccount,
  transactionHasBeenValidated,
  bridgePending,
  status,
  transitionTo,
}: StepProps) => {
  const onClick = async () => {
    transitionTo("summary");
  };

  const mainAccount = getMainAccount(account, parentAccount);

  const { errors } = status;
  const hasErrors = !!Object.keys(errors).length;
  const disabled = bridgePending || hasErrors || transactionHasBeenValidated;

  const {
    gasPrice: gasPriceError,
    maxPriorityFee: maxPriorityFeeError,
    maxFee: maxFeeError,
    replacementTransactionUnderpriced,
  } = errors;

  /**
   * To match the UX of StepAmount (see the StepAmountFooter component
   * under apps/ledger-live-desktop/src/renderer/modals/Send/steps/StepAmount.tsx),
   * we only want to display SpeedUp / Cancel specific errors as Alert.
   * All other errors should be displayed under specific fields components as done
   * in StepAmount.
   */
  const errorsToDisplay: Record<string, Error> | undefined = replacementTransactionUnderpriced
    ? { replacementTransactionUnderpriced: replacementTransactionUnderpriced }
    : undefined;

  return (
    <>
      {gasPriceError || maxPriorityFeeError || maxFeeError ? (
        <BuyButton currency={mainAccount.currency} account={mainAccount} />
      ) : null}
      <TransactionErrorBanner
        transactionHasBeenValidated={transactionHasBeenValidated}
        errors={errorsToDisplay}
      />
      <SharedFooterContinueButton
        id={"send-amount-continue-button"}
        isLoading={bridgePending}
        disabled={disabled}
        onClick={onClick}
      />
    </>
  );
};

export default memo<StepFeesProps>(StepFees);
