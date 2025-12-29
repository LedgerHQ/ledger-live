import React from "react";
import { Trans } from "react-i18next";
import invariant from "invariant";
import { useHederaValidators } from "@ledgerhq/live-common/families/hedera/react";
import { getMainAccount } from "@ledgerhq/coin-framework/account/helpers";
import { urls } from "~/config/urls";
import Alert from "~/renderer/components/Alert";
import Box from "~/renderer/components/Box";
import Button from "~/renderer/components/Button";
import ErrorBanner from "~/renderer/components/ErrorBanner";
import Label from "~/renderer/components/Label";
import CurrencyDownStatusAlert from "~/renderer/components/CurrencyDownStatusAlert";
import TranslatedError from "~/renderer/components/TranslatedError";
import type { StepProps } from "../types";
import AmountField from "../../shared/staking/AmountField";
import ValidatorsSelect from "../../shared/staking/ValidatorsSelect";

function StepSummary({
  t,
  account,
  parentAccount,
  transaction,
  status,
  error,
}: Readonly<StepProps>) {
  invariant(account && transaction, "hedera: account and transaction required");
  const mainAccount = account ? getMainAccount(account, parentAccount) : null;
  const currentValidatorNodeId = account.hederaResources?.delegation?.nodeId;
  const validators = useHederaValidators(account.currency);
  const validator = validators.find(v => v.nodeId === currentValidatorNodeId);
  const isValidatorRemoved = !validator && typeof currentValidatorNodeId === "number";
  const feeError = status.errors.fee;

  return (
    <Box flow={4}>
      {mainAccount ? <CurrencyDownStatusAlert currencies={[mainAccount.currency]} /> : null}
      {error && <ErrorBanner error={error} />}
      <Box>
        <Label mb={4}>
          <Trans i18nKey="hedera.undelegation.flow.steps.summary.validatorLabel" />
        </Label>
        <ValidatorsSelect
          disabled
          account={account}
          selectedValidatorNodeId={validator?.nodeId ?? null}
          showRemovedPlaceholder={isValidatorRemoved}
        />
      </Box>
      <Box>
        <Label mb={4}>
          <Trans i18nKey="hedera.undelegation.flow.steps.summary.amountLabel" />
        </Label>
        <AmountField account={account} />
      </Box>
      <Alert
        type="primary"
        learnMoreUrl={urls.hedera.staking}
        learnMoreLabel={<Trans i18nKey="hedera.undelegation.flow.steps.summary.learnMore" />}
      >
        {t("hedera.undelegation.flow.steps.summary.alert")}
      </Alert>
      {feeError && (
        <Alert type="error">
          <TranslatedError error={feeError} />
        </Alert>
      )}
    </Box>
  );
}

export function StepSummaryFooter({
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
        id="undelegation-continue-button"
        disabled={!canNext}
        primary
        onClick={() => transitionTo("connectDevice")}
      >
        <Trans i18nKey="common.continue" />
      </Button>
    </Box>
  );
}

export default React.memo(StepSummary);
