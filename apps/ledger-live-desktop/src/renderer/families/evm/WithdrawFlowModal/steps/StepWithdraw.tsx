import invariant from "invariant";
import React, { useMemo } from "react";
import { useTranslation, Trans } from "react-i18next";
import styled from "styled-components";
import { formatCurrencyUnit } from "@ledgerhq/live-common/currencies/index";
import TrackPage from "~/renderer/analytics/TrackPage";
import Box from "~/renderer/components/Box";
import Button from "~/renderer/components/Button";
import Text from "~/renderer/components/Text";
import Label from "~/renderer/components/Label";
import Alert from "~/renderer/components/Alert";
import ErrorBanner from "~/renderer/components/ErrorBanner";
import AccountFooter from "~/renderer/modals/Send/AccountFooter";
import EvmValidatorIcon from "~/renderer/families/evm/shared/components/EvmValidatorIcon";
import { useAccountUnit } from "~/renderer/hooks/useAccountUnit";
import { StepProps } from "../types";

const Container = styled(Box)`
  border: 1px solid ${p => p.theme.colors.neutral.c40};
  border-radius: 4px;
`;

export default function StepWithdraw({
  account,
  error,
  validatorAddress,
  amount,
}: Readonly<StepProps>) {
  invariant(account, "account required");
  const { t } = useTranslation();
  const unit = useAccountUnit(account);

  const validator = useMemo(
    () =>
      account.stakingResources.validators?.find(v => v.validatorAddress === validatorAddress) ?? {
        validatorAddress,
        name: validatorAddress,
      },
    [account.stakingResources.validators, validatorAddress],
  );

  const formattedAmount = formatCurrencyUnit(unit, amount, { showCode: true });

  return (
    <Box flow={1}>
      <TrackPage
        category="Withdraw Flow EVM"
        name="Step 1"
        flow="stake"
        action="withdraw"
        currency={account.currency.id}
      />
      {error && <ErrorBanner error={error} />}
      <Box mb={4}>
        <Label>{t("ethereum.evmStaking.withdraw.flow.steps.withdraw.fields.validator")}</Label>
        <Container horizontal alignItems="center" justifyContent="space-between" p={3}>
          <Box horizontal alignItems="center">
            <EvmValidatorIcon validator={validator} />
            <Text ml={2} ff="Inter|Medium" fontSize={4} color="neutral.c100">
              {validator.name}
            </Text>
          </Box>
          <Text ff="Inter|Regular" fontSize={4} color="neutral.c80">
            {formattedAmount}
          </Text>
        </Container>
      </Box>
      <Alert type="primary" mt={2}>
        <Trans i18nKey="ethereum.evmStaking.withdraw.flow.steps.withdraw.warning">
          <b></b>
        </Trans>
      </Alert>
    </Box>
  );
}

export function StepWithdrawFooter({
  transitionTo,
  account,
  parentAccount,
  onClose,
  status,
  bridgePending,
  amount,
}: Readonly<StepProps>) {
  const { t } = useTranslation();
  const { errors } = status;
  const canNext = !Object.keys(errors).length && amount.gt(0);
  return (
    <>
      <AccountFooter parentAccount={parentAccount} account={account} status={status} />
      <Box horizontal>
        <Button mr={1} onClick={onClose}>
          {t("common.cancel")}
        </Button>
        <Button
          isLoading={bridgePending}
          disabled={!canNext}
          primary
          onClick={() => transitionTo("connectDevice")}
        >
          {t("common.continue")}
        </Button>
      </Box>
    </>
  );
}
