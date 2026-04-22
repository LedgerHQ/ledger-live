import invariant from "invariant";
import React, { useCallback, useMemo } from "react";
import styled from "styled-components";
import { Trans } from "react-i18next";
import { BigNumber } from "bignumber.js";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import type { AccountBridge } from "@ledgerhq/types-live";
import type { GenericTransaction } from "@ledgerhq/live-common/bridge/generic-alpaca/types";
import type { StakingMappedDelegation } from "@ledgerhq/live-common/families/evm/staking/types";
import TrackPage from "~/renderer/analytics/TrackPage";
import Box from "~/renderer/components/Box";
import Button, { Base } from "~/renderer/components/Button";
import StepRecipientSeparator from "~/renderer/components/StepRecipientSeparator";
import Alert from "~/renderer/components/Alert";
import ErrorBanner from "~/renderer/components/ErrorBanner";
import Label from "~/renderer/components/Label";
import ChevronRight from "~/renderer/icons/ChevronRightSmall";
import EvmValidatorIcon from "~/renderer/families/evm/shared/components/EvmValidatorIcon";
import Text from "~/renderer/components/Text";
import AccountFooter from "~/renderer/modals/Send/AccountFooter";
import RedelegationSelectorField from "../fields/RedelegationSelectorField";
import { StepProps } from "../types";
import { getUnbondingPeriodDays } from "@ledgerhq/live-common/families/evm/staking/logic";
import { AmountField } from "../../UndelegationFlowModal/fields";

const SelectButton = styled(Base)`
  border-radius: 4px;
  border: 1px solid ${p => p.theme.colors.neutral.c40};
  height: 48px;
  width: 100%;
  padding-right: ${p => p.theme.space[3]}px;
  padding-left: ${p => p.theme.space[3]}px;
  &:hover {
    background-color: transparent;
    border-color: ${p => p.theme.colors.neutral.c40};
  }
`;

const Container = styled(Box).attrs<{ isOpen?: boolean }>(p => ({
  flow: 1,
  relative: true,
  mr: -p.theme.overflow.trackSize,
}))<{
  isOpen?: boolean;
}>`
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
  t,
  transitionTo,
}: StepProps) {
  invariant(transaction, "transaction required");

  const bridge = getAccountBridge(account, parentAccount) as AccountBridge<GenericTransaction>;
  const validators = account.stakingResources.validators ?? [];

  const updateRedelegation = useCallback(
    (patch: Partial<GenericTransaction>) => {
      onUpdateTransaction(tx => bridge.updateTransaction(tx, patch));
    },
    [bridge, onUpdateTransaction],
  );

  const updateSourceValidator = useCallback(
    (delegation?: StakingMappedDelegation | null) => {
      if (!delegation) return;
      const { validatorAddress: sourceValidator } = delegation;
      const source = account.stakingResources?.delegations.find(
        d => d.validatorAddress === sourceValidator,
      );
      updateRedelegation({
        ...transaction,
        valAddress: sourceValidator,
        amount: source?.amount ?? BigNumber(0),
      });
    },
    [updateRedelegation, transaction, account.stakingResources],
  );

  const onChangeAmount = useCallback(
    (amount: BigNumber) => {
      updateRedelegation({
        ...transaction,
        valAddress: transaction.valAddress,
        amount,
      });
    },
    [updateRedelegation, transaction],
  );

  const selectedDstValidator = useMemo(() => {
    if (!transaction.dstValAddress) return null;
    return validators.find(v => v.validatorAddress === transaction.dstValAddress) ?? null;
  }, [transaction.dstValAddress, validators]);

  const sourceDelegationAmount = useMemo(() => {
    if (!transaction.valAddress) return BigNumber(0);
    return (
      account.stakingResources?.delegations.find(d => d.validatorAddress === transaction.valAddress)
        ?.amount ?? BigNumber(0)
    );
  }, [transaction.valAddress, account.stakingResources?.delegations]);

  const open = useCallback(() => {
    transitionTo("destinationValidators");
  }, [transitionTo]);
  return (
    <Container>
      <TrackPage
        category="Redelegation Flow"
        name="Step 1"
        flow="stake"
        action="redelegation"
        currency={account.currency.id}
      />
      {error && error.name !== "RedelegateDstValAddressRequired" && <ErrorBanner error={error} />}
      <RedelegationSelectorField
        transaction={transaction}
        account={account}
        onChange={updateSourceValidator}
      />
      <StepRecipientSeparator />

      <Box py={4}>
        <Label mb={5}>
          {t("ethereum.evmStaking.redelegation.flow.steps.validators.newDelegation")}
        </Label>
        <SelectButton onClick={open}>
          <Box flex="1" horizontal alignItems="center" justifyContent="space-between">
            {selectedDstValidator ? (
              <Box horizontal alignItems="center">
                <EvmValidatorIcon validator={selectedDstValidator} />
                <Text ff="Inter|Medium" ml={2}>
                  {selectedDstValidator.name || selectedDstValidator.validatorAddress}
                </Text>
              </Box>
            ) : (
              <Text ff="Inter|Medium">
                {t("ethereum.evmStaking.redelegation.flow.steps.validators.chooseValidator")}
              </Text>
            )}
            <Box color="neutral.c40">
              <ChevronRight size={16} />
            </Box>
          </Box>
        </SelectButton>
      </Box>
      {selectedDstValidator && transaction.valAddress && (
        <Box pb={4}>
          <AmountField
            amount={transaction.amount}
            delegatedAmount={sourceDelegationAmount}
            account={account}
            status={status}
            onChange={onChangeAmount}
            label={t("ethereum.evmStaking.redelegation.flow.steps.validators.amountLabel")}
          />
        </Box>
      )}

      <Alert type="primary">
        <Trans
          i18nKey="ethereum.evmStaking.redelegation.flow.steps.validators.warning"
          values={{
            numberOfDays: getUnbondingPeriodDays(account.currency.id),
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
}: StepProps) {
  invariant(account, "account required");
  const { errors } = status;
  const hasErrors = Object.keys(errors).length;
  console.log("hasErrors", hasErrors);
  console.log("bridgePending", bridgePending);
  const canNext = !bridgePending && !hasErrors;
  console.log("canNext", canNext);

  return (
    <>
      <AccountFooter parentAccount={parentAccount} account={account} status={status} />
      <Box horizontal>
        <Button mr={1} onClick={onClose}>
          <Trans i18nKey="common.cancel" />
        </Button>
        <Button disabled={!canNext} primary onClick={() => transitionTo("connectDevice")}>
          <Trans i18nKey="common.continue" />
        </Button>
      </Box>
    </>
  );
}
