// @flow

import React, { PureComponent } from "react";
import { Trans } from "react-i18next";
import styled from "styled-components";
import {
  getAccountCurrency,
  getAccountName,
  getAccountUnit,
  getMainAccount,
} from "@ledgerhq/live-common/account/index";
import TrackPage from "~/renderer/analytics/TrackPage";
import Box from "~/renderer/components/Box";
import Button from "~/renderer/components/Button";
import CryptoCurrencyIcon from "~/renderer/components/CryptoCurrencyIcon";
import Ellipsis from "~/renderer/components/Ellipsis";
import FormattedVal from "~/renderer/components/FormattedVal";
import Text from "~/renderer/components/Text";
import TranslatedError from "~/renderer/components/TranslatedError";
import IconExclamationCircle from "~/renderer/icons/ExclamationCircle";
import IconQrCode from "~/renderer/icons/QrCode";
import IconWallet from "~/renderer/icons/Wallet";
import { rgba } from "~/renderer/styles/helpers";
import CounterValue from "~/renderer/components/CounterValue";
import Alert from "~/renderer/components/Alert";
import NFTSummary from "~/renderer/screens/nft/Send/Summary";
import type { ThemedComponent } from "~/renderer/styles/StyleProvider";
import type { StepProps } from "../types";
import AccountTagDerivationMode from "~/renderer/components/AccountTagDerivationMode";
import AccountFooter from "~/renderer/modals/Send/AccountFooter";
import CosmosLedgerValidatorIcon from "../LedgerPoolIcon";

const FromToWrapper: ThemedComponent<{}> = styled.div``;
const Circle: ThemedComponent<{}> = styled.div`
  height: 32px;
  width: 32px;
  border-radius: 32px;
  background-color: ${p => rgba(p.theme.colors.palette.primary.main, 0.1)};
  color: ${p => p.theme.colors.palette.primary.main};
  align-items: center;
  display: flex;
  justify-content: center;
  margin-right: 12px;
`;
const VerticalSeparator: ThemedComponent<{}> = styled.div`
  height: 18px;
  background: ${p => p.theme.colors.palette.text.shade20};
  width: 1px;
  margin: 1px 0px 0px 15px;
`;
const Separator: ThemedComponent<{}> = styled.div`
  height: 1px;
  background: ${p => p.theme.colors.palette.text.shade20};
  width: 100%;
  margin: 15px 0;
`;

const WARN_FROM_UTXO_COUNT = 50;

export default class StepSummary extends PureComponent<StepProps> {
  render() {
    const { account, parentAccount, transaction, currencyName, status, selectedPool } = this.props;
    if (!account) return null;
    const mainAccount = getMainAccount(account, parentAccount);
    if (!transaction) return null;
    const { estimatedFees, amount, totalSpent, txInputs } = status;
    const currency = getAccountCurrency(account);
    const feesUnit = getAccountUnit(mainAccount);
    const feesCurrency = getAccountCurrency(mainAccount);
    const unit = getAccountUnit(account);

    const showDeposit = !account.cardanoResources?.delegation?.status;
    return (
      <Box flow={4} mx={40}>
        <FromToWrapper>
          <Box>
            <Box horizontal alignItems="center">
              <Box flex={1}>
                <Text ff="Inter|Medium" color="palette.text.shade40" fontSize={4}>
                  {/* <Trans i18nKey="send.steps.details.to" /> */}
                  Delegating to
                </Text>
                <Ellipsis mt={2}>
                  <Box horizontal alignItems="center">
                    <CosmosLedgerValidatorIcon validator={selectedPool} />
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
              {/* <Trans i18nKey="send.steps.details.fees" /> */}
              Pool Cost
            </Text>
            <Box>
              <FormattedVal
                color={"palette.text.shade80"}
                disableRounding
                unit={feesUnit}
                alwaysShowValue
                val={selectedPool.cost}
                fontSize={4}
                inline
                showCode
              />
            </Box>
          </Box>
          <Box horizontal justifyContent="space-between" mt={1}>
            <Text ff="Inter|Medium" color="palette.text.shade40" fontSize={4}>
              {/* <Trans i18nKey="send.steps.details.fees" /> */}
              Commission
            </Text>
            <Box>
              <Text ff="Inter|Medium" color="palette.text.shade80" fontSize={4}>
                {/* <Trans i18nKey="send.steps.details.fees" /> */}
                {selectedPool.margin} %
              </Text>
            </Box>
          </Box>
          <Separator />
          {showDeposit ? (
            <Box horizontal justifyContent="space-between">
              <Text ff="Inter|Medium" color="palette.text.shade40" fontSize={4}>
                {/* <Trans i18nKey="send.steps.details.fees" /> */}
                Stake key registration deposit
              </Text>
              <Box>
                <FormattedVal
                  color={"palette.text.shade80"}
                  disableRounding
                  unit={feesUnit}
                  alwaysShowValue
                  val={2000000}
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

export function StepSummaryFooter({
  transitionTo,
  account,
  parentAccount,
  onClose,
  status,
  bridgePending,
  transaction,
}: StepProps) {
  // invariant(account, "account required");
  const { errors } = status;
  const canNext = true;
  // !bridgePending && !errors.validators && transaction && transaction.validators.length > 0;

  return (
    <>
      {/* <AccountFooter parentAccount={parentAccount} account={account} status={status} /> */}
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
