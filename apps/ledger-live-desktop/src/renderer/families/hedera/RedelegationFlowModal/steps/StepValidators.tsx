import invariant from "invariant";
import React from "react";
import { Trans } from "react-i18next";
import { useHederaEnrichedDelegation } from "@ledgerhq/live-common/families/hedera/react";
import { getMainAccount } from "@ledgerhq/coin-framework/account/helpers";
import type { AccountBridge } from "@ledgerhq/types-live";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import { HederaValidator, Transaction } from "@ledgerhq/live-common/families/hedera/types";
import { HEDERA_TRANSACTION_MODES } from "@ledgerhq/live-common/families/hedera/constants";
import { isStakingTransaction } from "@ledgerhq/live-common/families/hedera/utils";
import { urls } from "~/config/urls";
import Alert from "~/renderer/components/Alert";
import Box from "~/renderer/components/Box";
import Button from "~/renderer/components/Button";
import ErrorBanner from "~/renderer/components/ErrorBanner";
import StepRecipientSeparator from "~/renderer/components/StepRecipientSeparator";
import Label from "~/renderer/components/Label";
import CurrencyDownStatusAlert from "~/renderer/components/CurrencyDownStatusAlert";
import ValidatorsSelect from "~/renderer/families/hedera/shared/staking/ValidatorsSelect";
import AmountField from "../../shared/staking/AmountField";
import type { StepProps } from "../types";

function StepValidators({
  t,
  account,
  parentAccount,
  transaction,
  status,
  error,
  onUpdateTransaction,
}: Readonly<StepProps>) {
  invariant(account && transaction, "hedera: account and transaction required");
  invariant(account.hederaResources?.delegation, "hedera: delegation is required");
  invariant(isStakingTransaction(transaction), "hedera: staking tx expected");

  const { delegation } = account.hederaResources;
  const selectedValidatorNodeId = transaction.properties?.stakingNodeId ?? null;
  const mainAccount = account ? getMainAccount(account, parentAccount) : null;
  const enrichedDelegation = useHederaEnrichedDelegation(account, delegation);
  const isValidatorRemoved =
    !enrichedDelegation.validator.address && typeof delegation.nodeId === "number";

  const updateValidator = (validator: HederaValidator | null) => {
    if (!validator) return;
    const bridge: AccountBridge<Transaction> = getAccountBridge(account, parentAccount);
    onUpdateTransaction(() => {
      return bridge.updateTransaction(transaction, {
        mode: HEDERA_TRANSACTION_MODES.Redelegate,
        properties: {
          stakingNodeId: validator.nodeId ?? null,
        },
      });
    });
  };

  return (
    <Box flow={4}>
      {mainAccount ? <CurrencyDownStatusAlert currencies={[mainAccount.currency]} /> : null}
      {error && <ErrorBanner error={error} />}
      <Box>
        <Label mb={4}>
          <Trans i18nKey="hedera.redelegation.flow.steps.validators.currentValidatorLabel" />
        </Label>
        <ValidatorsSelect
          disabled
          account={account}
          selectedValidatorNodeId={enrichedDelegation.validator.nodeId}
          showRemovedPlaceholder={isValidatorRemoved}
        />
      </Box>
      <StepRecipientSeparator />
      <Box>
        <Label mb={4}>
          <Trans i18nKey="hedera.redelegation.flow.steps.validators.newValidatorLabel" />
        </Label>
        <ValidatorsSelect
          account={account}
          selectedValidatorNodeId={selectedValidatorNodeId}
          error={status.errors.stakingNodeId}
          onChangeValidator={updateValidator}
        />
      </Box>
      <Box>
        <Label mb={4}>
          <Trans i18nKey="hedera.redelegation.flow.steps.validators.amountLabel" />
        </Label>
        <AmountField account={account} />
      </Box>
      <Alert
        type="primary"
        learnMoreUrl={urls.hedera.staking}
        learnMoreLabel={<Trans i18nKey="hedera.redelegation.flow.steps.validators.learnMore" />}
      >
        {t("hedera.redelegation.flow.steps.validators.alert")}
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
}: Readonly<StepProps>) {
  const { errors } = status;
  const canNext = Object.keys(errors).length === 0 && !bridgePending && transaction;

  return (
    <Box horizontal justifyContent="flex-end" flow={2} grow>
      <Button mr={1} secondary onClick={onClose}>
        <Trans i18nKey="common.cancel" />
      </Button>
      <Button
        id="redelegation-continue-button"
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
