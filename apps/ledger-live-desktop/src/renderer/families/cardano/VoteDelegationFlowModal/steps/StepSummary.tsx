import React from "react";
import { Trans } from "react-i18next";
import styled from "styled-components";
import { getAccountCurrency } from "@ledgerhq/live-common/account/index";
import Box from "~/renderer/components/Box";
import Button from "~/renderer/components/Button";
import FormattedVal from "~/renderer/components/FormattedVal";
import Text from "~/renderer/components/Text";
import CounterValue from "~/renderer/components/CounterValue";
import { StepProps } from "../types";
import BigNumber from "bignumber.js";
import { useMaybeAccountUnit } from "~/renderer/hooks/useAccountUnit";
import IconExclamationCircle from "~/renderer/icons/ExclamationCircle";
import TranslatedError from "~/renderer/components/TranslatedError";
import { useDateFormatter, dayAndHourFormat } from "~/renderer/hooks/useDateFormatter";
import StepProgress from "~/renderer/components/StepProgress";

const FromToWrapper = styled.div``;
const Separator = styled.div`
  height: 1px;
  background: ${p => p.theme.colors.neutral.c40};
  width: 100%;
  margin: 15px 0;
`;

const DRepNameAndHexContainer = styled(Box).attrs(() => ({
  alignItems: "start",
}))`
  ${Text} {
    width: min-content;
    max-width: 80%;
    flex: 0 1 auto;
    display: block;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
`;



function StepSummary(props: StepProps) {
  const { account, transaction, status, selectedDRep, bridgePending } = props;

  const feesUnit = useMaybeAccountUnit(account);
  const formatDate = useDateFormatter(dayAndHourFormat);
  if (
    !account ||
    !transaction ||
    (!selectedDRep && !transaction.dRepAbstain && !transaction.dRepNoConfidence)
  ) {
    return null;
  }

  if (bridgePending || !transaction.protocolParams) {
    return <StepProgress />;
  }

  const { estimatedFees, warnings } = status;
  const { feeTooHigh } = warnings;
  const feesCurrency = getAccountCurrency(account);
  const showDeposit = !account.cardanoResources?.delegation?.status;
  const stakeKeyDeposit = transaction.protocolParams.stakeKeyDeposit;
  return (
    <Box flow={4} mx={40}>
      <FromToWrapper>
        <Box>
          <Box horizontal alignItems="center">
            <Box flex={1}>
              <Text ff="Inter|Medium" color="neutral.c70" fontSize={4}>
                <Trans i18nKey="cardano.voteDelegation.delegatingTo" />
              </Text>
              <Box my={1}>
                <DRepNameAndHexContainer>
                  <Text
                    ff="Inter"
                    color="neutral.c100"
                    fontSize={4}
                    ml={2}
                    data-testid="dRep-name-label"
                  >
                    {transaction.dRepAbstain ? (
                       <Trans i18nKey="voteDelegation.options.alwaysAbstain" />
                    ) : transaction.dRepNoConfidence ? (
                       <Trans i18nKey="voteDelegation.options.alwaysNoConfidence" />
                    ) : (
                      selectedDRep?.meta?.givenName || ""
                    )}
                  </Text>
                  {selectedDRep && (
                    <Text
                      ff="Inter"
                      color="neutral.c90"
                      fontSize={3}
                      ml={2}
                      data-testid="dRep-name-label"
                    >
                      {selectedDRep.hex}
                    </Text>
                  )}
                </DRepNameAndHexContainer>
              </Box>
            </Box>
          </Box>
        </Box>
        {selectedDRep?.active && (
          <Box horizontal justifyContent="space-between" mt={1}>
            <Text ff="Inter|Medium" color="neutral.c70" fontSize={4}>
              <Trans i18nKey="cardano.voteDelegation.lastActiveOn" />
            </Text>
            <Box>
              <Text ff="Inter|Medium" color="neutral.c80" fontSize={4}>
                {formatDate(new Date(selectedDRep.active))}
              </Text>
            </Box>
          </Box>
        )}

        <Separator />
        {showDeposit ? (
          <Box horizontal justifyContent="space-between">
            <Text ff="Inter|Medium" color="neutral.c70" fontSize={4}>
              <Trans i18nKey="cardano.voteDelegation.stakeKeyRegistrationDeposit" />
            </Text>
            <Box>
              <FormattedVal
                color={"neutral.c80"}
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
          <Text ff="Inter|Medium" color="neutral.c70" fontSize={4}>
            <Trans i18nKey="send.steps.details.fees" />
          </Text>
          <Box>
            <FormattedVal
              data-testid="fees-amount-step-summary"
              color={feeTooHigh ? "warning" : "neutral.c80"}
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
                color={feeTooHigh ? "warning" : "neutral.c60"}
                fontSize={3}
                currency={feesCurrency}
                value={estimatedFees}
                alwaysShowSign={false}
                alwaysShowValue
              />
            </Box>
          </Box>
        </Box>
        {feeTooHigh ? (
          <Box horizontal justifyContent="flex-end" alignItems="center" color="warning">
            <IconExclamationCircle size={10} />
            <Text
              ff="Inter|Medium"
              fontSize={2}
              style={{
                marginLeft: "5px",
              }}
            >
              <TranslatedError error={feeTooHigh} />
            </Text>
          </Box>
        ) : null}
      </FromToWrapper>
    </Box>
  );
}

export function StepSummaryFooter({ transitionTo, transaction, onClose }: StepProps) {
  const canNext = true;
  const isDirectMode = transaction?.dRepAbstain || transaction?.dRepNoConfidence;

  return (
    <>
      <Box horizontal>
        {isDirectMode ? (
          <Button mr={1} onClick={onClose}>
            <Trans i18nKey="common.cancel" />
          </Button>
        ) : (
          <Button mr={1} onClick={() => transitionTo("dRep")}>
            <Trans i18nKey="common.back" />
          </Button>
        )}
        <Button
          id="vote-delegate-continue-button"
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

export default React.memo(StepSummary);
