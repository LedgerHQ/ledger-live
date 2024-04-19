import React, { PureComponent } from "react";
import { Trans } from "react-i18next";
import styled from "styled-components";
import { getAccountUnit, getAccountCurrency } from "@ledgerhq/live-common/account/index";
import Box from "~/renderer/components/Box";
import Button from "~/renderer/components/Button";
import FormattedVal from "~/renderer/components/FormattedVal";
import Text from "~/renderer/components/Text";
import CounterValue from "~/renderer/components/CounterValue";
import ErrorBanner from "~/renderer/components/ErrorBanner";
import TranslatedError from "~/renderer/components/TranslatedError";
import { StepProps } from "../types";
import BigNumber from "bignumber.js";
import Alert from "~/renderer/components/Alert";

const FromToWrapper = styled.div``;
const Separator = styled.div`
  height: 1px;
  background: ${p => p.theme.colors.palette.text.shade20};
  width: 100%;
  margin: 15px 0;
`;

export default class StepSummary extends PureComponent<StepProps> {
  render() {
    const { account, transaction, status, error } = this.props;
    const { estimatedFees, errors } = status;
    if (!account) return null;
    if (!transaction) return null;
    const accountUnit = getAccountUnit(account);
    const feesCurrency = getAccountCurrency(account);
    const stakeKeyDeposit = account.cardanoResources?.protocolParams.stakeKeyDeposit;
    const displayError = errors.amount?.message ? errors.amount : "";
    return (
      <Box flow={4} mx={40}>
        {error && <ErrorBanner error={error} />}

        <FromToWrapper>
          <Box>
            <Box horizontal alignItems="center">
              <Box flex={1}>
                <Text ff="Inter" color="palette.text.shade100" fontSize={4} ml={2}>
                  <Trans i18nKey="cardano.unDelegation.message" />
                </Text>
              </Box>
            </Box>
          </Box>
          <Separator />

          <Box horizontal justifyContent="space-between" mt={1}>
            <Text ff="Inter|Medium" color="palette.text.shade40" fontSize={4}>
              <Trans i18nKey="cardano.unDelegation.refund" />
            </Text>
            <Box>
              <FormattedVal
                color={"palette.text.shade80"}
                disableRounding
                unit={accountUnit}
                alwaysShowValue
                val={new BigNumber(stakeKeyDeposit)}
                fontSize={4}
                inline
                showCode
              />
            </Box>
          </Box>
          <Separator />
          <Box horizontal justifyContent="space-between">
            <Text ff="Inter|Medium" color="palette.text.shade40" fontSize={4}>
              <Trans i18nKey="send.steps.details.fees" />
            </Text>
            <Box>
              <FormattedVal
                color={"palette.text.shade80"}
                disableRounding
                unit={accountUnit}
                alwaysShowValue
                val={estimatedFees}
                fontSize={4}
                inline
                showCode
              />
              <Box textAlign="right">
                <CounterValue
                  color={"palette.text.shade60"}
                  fontSize={3}
                  currency={feesCurrency}
                  value={estimatedFees}
                  alwaysShowSign={false}
                  alwaysShowValue
                />
              </Box>
            </Box>
          </Box>
        </FromToWrapper>
        {displayError ? (
          <Box grow>
            <Alert type="error">
              <TranslatedError error={displayError} field="title" />
            </Alert>
          </Box>
        ) : null}
      </Box>
    );
  }
}
export function StepSummaryFooter({
  transitionTo,
  status,
  bridgePending,
  transaction,
  onClose,
}: StepProps) {
  const { errors } = status;
  const canNext = !errors.amount && !bridgePending && !errors.validators && transaction;
  return (
    <>
      <Box horizontal justifyContent="flex-end" flow={2} grow>
        <Button mr={1} secondary onClick={onClose}>
          <Trans i18nKey="common.cancel" />
        </Button>
        <Button
          id="undelegate-continue-button"
          disabled={!canNext}
          primary
          onClick={() => transitionTo("connectDevice")}
        >
          <Trans i18nKey="common.continue" />
        </Button>
      </Box>
    </>
  );
}
