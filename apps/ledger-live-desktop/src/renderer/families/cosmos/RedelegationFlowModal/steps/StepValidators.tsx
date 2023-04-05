import invariant from "invariant";
import React, { useCallback, useMemo } from "react";
import styled from "styled-components";
import { Trans } from "react-i18next";
import { BigNumber } from "bignumber.js";
import { StepProps } from "../types";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import { ThemedComponent } from "~/renderer/styles/StyleProvider";
import { useCosmosFamilyPreloadData } from "@ledgerhq/live-common/families/cosmos/react";
import TrackPage from "~/renderer/analytics/TrackPage";
import Box from "~/renderer/components/Box";
import Button, { Base } from "~/renderer/components/Button";
import RedelegationSelectorField from "../fields/RedelegationSelectorField";
import StepRecipientSeparator from "~/renderer/components/StepRecipientSeparator";
import Alert from "~/renderer/components/Alert";
import { AmountField } from "~/renderer/families/cosmos/UndelegationFlowModal/fields/index";
import ErrorBanner from "~/renderer/components/ErrorBanner";
import Label from "~/renderer/components/Label";
import ChevronRight from "~/renderer/icons/ChevronRightSmall";
import CosmosFamilyLedgerValidatorIcon from "~/renderer/families/cosmos/shared/components/CosmosFamilyLedgerValidatorIcon";
import Text from "~/renderer/components/Text";
import AccountFooter from "~/renderer/modals/Send/AccountFooter";
import cryptoFactory from "@ledgerhq/live-common/families/cosmos/chain/chain";
const SelectButton = styled(Base)`
  border-radius: 4px;
  border: 1px solid ${p => p.theme.colors.palette.divider};
  height: 48px;
  width: 100%;
  padding-right: ${p => p.theme.space[3]}px;
  padding-left: ${p => p.theme.space[3]}px;
  &:hover {
    background-color: transparent;
    border-color: ${p => p.theme.colors.palette.text.shade30};
  }
`;
const Container: ThemedComponent<any> = styled(Box).attrs(p => ({
  flow: 1,
  relative: true,
  mr: -p.theme.overflow.trackSize,
}))`
  min-height: 330px;
  max-height: calc(100% - ${p => p.theme.space[6]}px);
  padding-bottom: 20px;
  margin-bottom: -${p => p.theme.space[6]}px;
  overflow-y: ${p => (p.isOpen ? "hidden" : "scroll")};
  > * + * {
    margin-top: 0px;
  }
`;
export default function StepValidators({
  account,
  parentAccount,
  onUpdateTransaction,
  transaction,
  status,
  error,
  bridgePending,
  t,
  transitionTo,
}: StepProps) {
  invariant(account && account.cosmosResources && transaction, "account and transaction required");
  const bridge = getAccountBridge(account, parentAccount);
  const sourceValidator = useMemo(
    () =>
      account.cosmosResources?.delegations.find(
        d => d.validatorAddress === transaction.sourceValidator,
      ),
    [account, transaction.sourceValidator],
  );
  const updateRedelegation = useCallback(
    newTransaction => {
      onUpdateTransaction(transaction => bridge.updateTransaction(transaction, newTransaction));
    },
    [bridge, onUpdateTransaction],
  );
  const updateSourceValidator = useCallback(
    ({ validatorAddress: sourceValidator, ...r }) => {
      const source = account.cosmosResources?.delegations.find(
        d => d.validatorAddress === sourceValidator,
      );
      updateRedelegation({
        ...transaction,
        sourceValidator,
        validators:
          transaction.validators && transaction.validators.length > 0
            ? [
                {
                  ...transaction.validators[0],
                  amount: source?.amount ?? BigNumber(0),
                },
              ]
            : [],
      });
    },
    [updateRedelegation, transaction, account.cosmosResources],
  );
  const onChangeAmount = useCallback(
    amount =>
      updateRedelegation({
        ...transaction,
        validators:
          transaction.validators && transaction.validators.length > 0
            ? [
                {
                  ...transaction.validators[0],
                  amount,
                },
              ]
            : [],
      }),
    [updateRedelegation, transaction],
  );
  const selectedValidator = useMemo(() => transaction.validators && transaction.validators[0], [
    transaction,
  ]);
  const amount = useMemo(() => (selectedValidator ? selectedValidator.amount : BigNumber(0)), [
    selectedValidator,
  ]);
  const currencyName = account.currency.name.toLowerCase();
  const { validators } = useCosmosFamilyPreloadData(currencyName);
  const selectedValidatorData = useMemo(
    () =>
      transaction.validators && transaction.validators[0]
        ? validators.find(
            ({ validatorAddress }) => validatorAddress === transaction.validators[0].address,
          )
        : null,
    [transaction, validators],
  );
  const open = useCallback(() => {
    transitionTo("destinationValidators");
  }, [transitionTo]);
  const crypto = cryptoFactory(account.currency.id);
  return (
    <Container>
      <TrackPage category="Redelegation Flow" name="Step 1" />
      {error && <ErrorBanner error={error} />}
      <RedelegationSelectorField
        transaction={transaction}
        account={account}
        t={t}
        onChange={updateSourceValidator}
      />
      <StepRecipientSeparator />

      <Box py={4}>
        <Label mb={5}>{t("cosmos.redelegation.flow.steps.validators.newDelegation")}</Label>
        <SelectButton onClick={open}>
          <Box flex="1" horizontal alignItems="center" justifyContent="space-between">
            {selectedValidatorData ? (
              <Box horizontal alignItems="center">
                <CosmosFamilyLedgerValidatorIcon validator={selectedValidatorData} />
                <Text ff="Inter|Medium" ml={2}>
                  {selectedValidatorData.name || selectedValidatorData.validatorAddress}
                </Text>
              </Box>
            ) : (
              <Text ff="Inter|Medium">
                {t("cosmos.redelegation.flow.steps.validators.chooseValidator")}
              </Text>
            )}
            <Box color="palette.text.shade20">
              <ChevronRight size={16} color="palette.divider" />
            </Box>
          </Box>
        </SelectButton>
      </Box>
      {selectedValidatorData && (
        <Box pb={4}>
          <AmountField
            amount={amount}
            validator={sourceValidator}
            account={account}
            status={status}
            onChange={onChangeAmount}
            label={t("cosmos.redelegation.flow.steps.validators.amountLabel")}
          />
        </Box>
      )}

      <Alert type="primary">
        <Trans
          i18nKey="cosmos.redelegation.flow.steps.validators.warning"
          values={{
            numberOfDays: crypto.unbondingPeriod,
          }}
        >
          <b></b>
        </Trans>
      </Alert>
    </Container>
  );
}
export function StepValidatorsFooter({
  transitionTo,
  account,
  parentAccount,
  onClose,
  status,
  bridgePending,
  transaction,
}: StepProps) {
  invariant(account, "account required");
  const { errors } = status;
  const hasErrors = Object.keys(errors).length;
  const canNext = !bridgePending && !hasErrors;
  return (
    <>
      <AccountFooter parentAccount={parentAccount} account={account} status={status} />
      <Box horizontal>
        <Button mr={1} secondary onClick={onClose}>
          <Trans i18nKey="common.cancel" />
        </Button>
        <Button disabled={!canNext} primary onClick={() => transitionTo("connectDevice")}>
          <Trans i18nKey="common.continue" />
        </Button>
      </Box>
    </>
  );
}
