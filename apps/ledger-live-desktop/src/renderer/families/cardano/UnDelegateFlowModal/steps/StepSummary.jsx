// @flow

import React, { PureComponent } from "react";
import { Trans } from "react-i18next";
import styled from "styled-components";
import { getAccountUnit, getMainAccount } from "@ledgerhq/live-common/account/index";
import Box from "~/renderer/components/Box";
import Button from "~/renderer/components/Button";
import FormattedVal from "~/renderer/components/FormattedVal";
import Text from "~/renderer/components/Text";
import type { ThemedComponent } from "~/renderer/styles/StyleProvider";
import type { StepProps } from "../types";

const FromToWrapper: ThemedComponent<{}> = styled.div``;

const Separator: ThemedComponent<{}> = styled.div`
  height: 1px;
  background: ${p => p.theme.colors.palette.text.shade20};
  width: 100%;
  margin: 15px 0;
`;

export default class StepSummary extends PureComponent<StepProps> {
  render() {
    const { account, parentAccount, transaction } = this.props;
    if (!account) return null;
    const mainAccount = getMainAccount(account, parentAccount);
    if (!transaction) return null;
    const accountUnit = getAccountUnit(mainAccount);

    const stakeKeyDeposit = account.cardanoResources?.protocolParams.stakeKeyDeposit;

    return (
      <Box flow={4} mx={40}>
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
                val={stakeKeyDeposit}
                fontSize={4}
                inline
                showCode
              />
            </Box>
          </Box>
        </FromToWrapper>
      </Box>
    );
  }
}

export function StepSummaryFooter({
  transitionTo,
  account,
  parentAccount,
  onClose,
  status,
  bridgePending,
  transaction,
}: StepProps) {
  const { errors } = status;
  const canNext = true;

  return (
    <>
      <Box horizontal>
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
