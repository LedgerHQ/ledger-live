import React, { PureComponent } from "react";
import { Trans } from "react-i18next";
import styled from "styled-components";
import { getAccountCurrency, getAccountUnit } from "@ledgerhq/live-common/account/index";
import Box from "~/renderer/components/Box";
import Button from "~/renderer/components/Button";
import Ellipsis from "~/renderer/components/Ellipsis";
import FormattedVal from "~/renderer/components/FormattedVal";
import Text from "~/renderer/components/Text";
import CounterValue from "~/renderer/components/CounterValue";
import { StepProps } from "../types";
import CardanoLedgerPoolIcon from "../LedgerPoolIcon";
import BigNumber from "bignumber.js";

const FromToWrapper = styled.div``;
const Separator = styled.div`
  height: 1px;
  background: ${p => p.theme.colors.palette.text.shade20};
  width: 100%;
  margin: 15px 0;
`;

export default class StepSummary extends PureComponent<StepProps> {
  render() {
    const { account, transaction, status, selectedPool } = this.props;
    if (!account) return null;
    if (!transaction) return null;
    const { estimatedFees } = status;
    const feesUnit = getAccountUnit(account);
    const feesCurrency = getAccountCurrency(account);
    const showDeposit = !account.cardanoResources?.delegation?.status;
    const stakeKeyDeposit = account.cardanoResources?.protocolParams.stakeKeyDeposit;
    return (
      <Box flow={4} mx={40}>
        <FromToWrapper>
          <Box>
            <Box horizontal alignItems="center">
              <Box flex={1}>
                <Text ff="Inter|Medium" color="palette.text.shade40" fontSize={4}>
                  <Trans i18nKey="cardano.delegation.delegatingTo" />
                </Text>
                <Ellipsis mt={2}>
                  <Box horizontal alignItems="center">
                    <CardanoLedgerPoolIcon validator={selectedPool} />
                    <Text ff="Inter" color="palette.text.shade100" fontSize={4} ml={2}>
                      {`${selectedPool.name} [${selectedPool.ticker}]`}
                    </Text>
                  </Box>
                </Ellipsis>
              </Box>
            </Box>
          </Box>
          <Box horizontal justifyContent="space-between" mt={1}>
            <Text ff="Inter|Medium" color="palette.text.shade40" fontSize={4}>
              <Trans i18nKey="cardano.delegation.cost" />
            </Text>
            <Box>
              <FormattedVal
                color={"palette.text.shade80"}
                disableRounding
                unit={feesUnit}
                alwaysShowValue
                val={new BigNumber(selectedPool.cost)}
                fontSize={4}
                inline
                showCode
              />
            </Box>
          </Box>
          <Box horizontal justifyContent="space-between" mt={1}>
            <Text ff="Inter|Medium" color="palette.text.shade40" fontSize={4}>
              <Trans i18nKey="cardano.delegation.commission" />
            </Text>
            <Box>
              <Text ff="Inter|Medium" color="palette.text.shade80" fontSize={4}>
                {selectedPool.margin} %
              </Text>
            </Box>
          </Box>
          <Separator />
          {showDeposit ? (
            <Box horizontal justifyContent="space-between">
              <Text ff="Inter|Medium" color="palette.text.shade40" fontSize={4}>
                <Trans i18nKey="cardano.delegation.stakeKeyRegistrationDeposit" />
              </Text>
              <Box>
                <FormattedVal
                  color={"palette.text.shade80"}
                  disableRounding
                  unit={feesUnit}
                  alwaysShowValue
                  val={new BigNumber(stakeKeyDeposit)}
                  fontSize={4}
                  inline
                  showCode
                />
              </Box>
            </Box>
          ) : null}
          <Box horizontal justifyContent="space-between">
            <Text ff="Inter|Medium" color="palette.text.shade40" fontSize={4}>
              <Trans i18nKey="send.steps.details.fees" />
            </Text>
            <Box>
              <FormattedVal
                color={"palette.text.shade80"}
                disableRounding
                unit={feesUnit}
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
      </Box>
    );
  }
}

export function StepSummaryFooter({ transitionTo }: StepProps) {
  const canNext = true;
  return (
    <>
      <Box horizontal>
        <Button mr={1} secondary onClick={() => transitionTo("validator")}>
          <Trans i18nKey="common.back" />
        </Button>
        <Button
          id="delegate-continue-button"
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
