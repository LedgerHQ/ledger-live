import React from "react";
import { Trans } from "react-i18next";
import invariant from "invariant";
import { useHederaValidators } from "@ledgerhq/live-common/families/hedera/react";
import { getMainAccount } from "@ledgerhq/coin-framework/account/helpers";
import { AccountBridge } from "@ledgerhq/types-live";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import { HederaValidator, Transaction } from "@ledgerhq/live-common/families/hedera/types";
import { urls } from "~/config/urls";
import Alert from "~/renderer/components/Alert";
import Box from "~/renderer/components/Box";
import Button from "~/renderer/components/Button";
import ErrorBanner from "~/renderer/components/ErrorBanner";
import StepRecipientSeparator from "~/renderer/components/StepRecipientSeparator";
import Label from "~/renderer/components/Label";
import CurrencyDownStatusAlert from "~/renderer/components/CurrencyDownStatusAlert";
import ValidatorsSelect from "~/renderer/families/hedera/shared/staking/ValidatorsSelect";
import type { StepProps } from "../types";
import AmountField from "../../shared/staking/AmountField";

function StepValidators({
  t,
  account,
  parentAccount,
  transaction,
  status,
  error,
  onUpdateTransaction,
}: StepProps) {
  invariant(account && transaction, "hedera: account and transaction required");
  const mainAccount = account ? getMainAccount(account, parentAccount) : null;
  const validators = useHederaValidators(account.currency);

  const { delegation } = account.hederaResources ?? {};
  const currentValidator = validators.find(v => v.nodeId === delegation?.nodeId);
  const selectedValidatorAddress = transaction.recipient ?? null;

  const updateValidator = (validator: HederaValidator | null) => {
    if (!validator) return;
    const bridge: AccountBridge<Transaction> = getAccountBridge(account, parentAccount);
    onUpdateTransaction(() => {
      console.log("[DEBUG] updating tx", validator);
      return bridge.updateTransaction(transaction, {
        recipient: validator.address,
        properties: {
          name: "updateAccount",
          mode: "redelegate",
          stakedNodeId: validator.nodeId ?? null,
        },
      });
    });
  };

  if (!currentValidator) {
    return null;
  }

  return (
    <Box flow={4}>
      {mainAccount ? <CurrencyDownStatusAlert currencies={[mainAccount.currency]} /> : null}
      {error && <ErrorBanner error={error} />}
      <Box>
        <Label mb={4}>
          <Trans i18nKey="hedera.redelegate.flow.steps.validators.currentValidatorLabel" />
        </Label>
        <ValidatorsSelect
          disabled
          account={account}
          selectedValidatorAddress={currentValidator.address}
        />
      </Box>
      <StepRecipientSeparator />
      <Box>
        <Label mb={4}>
          <Trans i18nKey="hedera.redelegate.flow.steps.validators.newValidatorLabel" />
        </Label>
        <ValidatorsSelect
          account={account}
          selectedValidatorAddress={selectedValidatorAddress}
          error={status.errors["stakedNodeId"]}
          onChangeValidator={updateValidator}
        />
      </Box>
      <Box>
        <Label mb={4}>
          <Trans i18nKey="hedera.redelegate.flow.steps.validators.amountLabel" />
        </Label>
        <AmountField status={status} account={account} transaction={transaction} />
      </Box>
      <Alert
        type="primary"
        learnMoreUrl={urls.hedera.staking}
        learnMoreLabel={<Trans i18nKey="hedera.redelegate.flow.steps.validators.learnMore" />}
      >
        {t("hedera.redelegate.flow.steps.validators.alert")}
      </Alert>
    </Box>
  );
}

export function StepValidatorsFooter({
  transitionTo,
  status,
  bridgePending,
  transaction,
  onClose,
}: StepProps) {
  const { errors } = status;
  const canNext = Object.keys(errors).length === 0 && !bridgePending && transaction;

  return (
    <Box horizontal justifyContent="flex-end" flow={2} grow>
      <Button mr={1} secondary onClick={onClose}>
        <Trans i18nKey="common.cancel" />
      </Button>
      <Button
        id="redelegate-continue-button"
        disabled={!canNext}
        primary
        onClick={() => transitionTo("connectDevice")}
      >
        <Trans i18nKey="common.continue" />
      </Button>
    </Box>
  );
}

export default React.memo(StepValidators);
