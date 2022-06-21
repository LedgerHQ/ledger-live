// @flow

/** NOTE: The purpose of this custom component is purely to re-arrange
 *  the order of the transaction details to have it be aligned and consistent
 *  with the order of the transaction details set in `deviceTransactionConfig`,.
 *  I.e., 1. Amount | 2. Fees | 3. Memo
 *  At the time of creating this component (06/17/22), the 'Memo' detail in the core
 *  `StepSummary` component is above the 'Amount' and 'Network fees' details, respectively.
 *  I.e., 1. Memo | 2. Amount | 3. Fees
 *
 *  _Please_ adjust (or delete) this note if this custom component is to ever be altered for a purpose
 *  other than the note listed above.
 */

import type { ThemedComponent } from "~/renderer/styles/StyleProvider";
import type { StepProps } from "~/renderer/modals/Send/types";

import React, { PureComponent } from "react";
import { Trans } from "react-i18next";
import styled from "styled-components";
import {
  getAccountCurrency,
  getAccountName,
  getAccountUnit,
  getMainAccount,
} from "@ledgerhq/live-common/lib/account";

import TrackPage from "~/renderer/analytics/TrackPage";
import { rgba } from "~/renderer/styles/helpers";

import Box from "~/renderer/components/Box";
import CryptoCurrencyIcon from "~/renderer/components/CryptoCurrencyIcon";
import Ellipsis from "~/renderer/components/Ellipsis";
import FormattedVal from "~/renderer/components/FormattedVal";
import Text from "~/renderer/components/Text";
import TranslatedError from "~/renderer/components/TranslatedError";
import CounterValue from "~/renderer/components/CounterValue";
import Alert from "~/renderer/components/Alert";
import AccountTagDerivationMode from "~/renderer/components/AccountTagDerivationMode";

import IconExclamationCircle from "~/renderer/icons/ExclamationCircle";
import IconQrCode from "~/renderer/icons/QrCode";
import IconWallet from "~/renderer/icons/Wallet";

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
    const { account, parentAccount, transaction, status, currencyName } = this.props;
    if (!account) return null;
    const mainAccount = getMainAccount(account, parentAccount);
    if (!mainAccount || !transaction) return null;
    const { estimatedFees, amount, totalSpent, warnings, txInputs } = status;
    const feeTooHigh = warnings.feeTooHigh;
    const currency = getAccountCurrency(account);
    const feesUnit = getAccountUnit(mainAccount);
    const feesCurrency = getAccountCurrency(mainAccount);
    const unit = getAccountUnit(account);
    const utxoLag = txInputs ? txInputs.length >= WARN_FROM_UTXO_COUNT : null;
    const hasNonEmptySubAccounts =
      account.type === "Account" &&
      (account.subAccounts || []).some(subAccount => subAccount.balance.gt(0));

    // $FlowFixMe
    const memo = transaction.memo;

    return (
      <Box flow={4} mx={40}>
        <TrackPage category="Send Flow" name="Step Summary" currencyName={currencyName} />
        {utxoLag ? (
          <Alert type="warning">
            <Trans i18nKey="send.steps.details.utxoLag" />
          </Alert>
        ) : null}
        {transaction.useAllAmount && hasNonEmptySubAccounts ? (
          <Alert type="primary">
            <Trans
              i18nKey="send.steps.details.subaccountsWarning"
              values={{
                currency: currency.name,
              }}
            />
          </Alert>
        ) : null}
        <FromToWrapper>
          <Box>
            <Box horizontal alignItems="center">
              <Circle>
                <IconWallet size={14} />
              </Circle>
              <Box flex="1">
                <Text ff="Inter|Medium" color="palette.text.shade40" fontSize={4}>
                  <Trans i18nKey="send.steps.details.from" />
                </Text>
                <Box horizontal alignItems="center">
                  <div style={{ marginRight: 7 }}>
                    <CryptoCurrencyIcon size={16} currency={currency} />
                  </div>
                  <Text ff="Inter" color="palette.text.shade100" fontSize={4} style={{ flex: 1 }}>
                    {getAccountName(account)}
                  </Text>
                  <AccountTagDerivationMode account={account} />
                </Box>
              </Box>
            </Box>
            <VerticalSeparator />
            <Box horizontal alignItems="center">
              <Circle>
                <IconQrCode size={14} />
              </Circle>
              <Box flex={1}>
                <Text ff="Inter|Medium" color="palette.text.shade40" fontSize={4}>
                  <Trans i18nKey="send.steps.details.to" />
                </Text>
                <Ellipsis>
                  <Text ff="Inter" color="palette.text.shade100" fontSize={4}>
                    {transaction.recipient}
                  </Text>
                </Ellipsis>
              </Box>
            </Box>
          </Box>
          <Separator />

          {/* amount transaction detail */}
          <Box horizontal justifyContent="space-between" mb={2}>
            <Text ff="Inter|Medium" color="palette.text.shade40" fontSize={4}>
              <Trans i18nKey="send.steps.details.amount" />
            </Text>
            <Box>
              <FormattedVal
                color={"palette.text.shade80"}
                disableRounding
                unit={unit}
                val={amount}
                fontSize={4}
                inline
                showCode
              />
              <Box textAlign="right">
                <CounterValue
                  color="palette.text.shade60"
                  fontSize={3}
                  currency={currency}
                  value={amount}
                  alwaysShowSign={false}
                />
              </Box>
            </Box>
          </Box>

          {/* transaction fee transaction detail */}
          <Box horizontal justifyContent="space-between">
            <Text ff="Inter|Medium" color="palette.text.shade40" fontSize={4}>
              <Trans i18nKey="send.steps.details.fees" />
            </Text>
            <Box>
              <FormattedVal
                color={feeTooHigh ? "warning" : "palette.text.shade80"}
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
                  color={feeTooHigh ? "warning" : "palette.text.shade60"}
                  fontSize={3}
                  currency={feesCurrency}
                  value={estimatedFees}
                  alwaysShowSign={false}
                  alwaysShowValue
                />
              </Box>
            </Box>
          </Box>

          {/* memo transaction detail */}
          {memo && (
            <Box horizontal justifyContent="space-between" mb={2}>
              <Text ff="Inter|Medium" color="palette.text.shade40" fontSize={4}>
                <Trans i18nKey="operationDetails.extra.memo" />
              </Text>
              <Text ff="Inter|Medium" fontSize={4}>
                {memo}
              </Text>
            </Box>
          )}

          {feeTooHigh ? (
            <Box horizontal justifyContent="flex-end" alignItems="center" color="warning">
              <IconExclamationCircle size={10} />
              <Text ff="Inter|Medium" fontSize={2} style={{ marginLeft: "5px" }}>
                <TranslatedError error={feeTooHigh} />
              </Text>
            </Box>
          ) : null}

          {!totalSpent.eq(amount) ? (
            <>
              <Separator />
              <Box horizontal justifyContent="space-between">
                <Text ff="Inter|Medium" color="palette.text.shade40" fontSize={4}>
                  <Trans i18nKey="send.totalSpent" />
                </Text>

                <Box>
                  <FormattedVal
                    color={"palette.text.shade80"}
                    disableRounding
                    unit={unit}
                    val={totalSpent}
                    fontSize={4}
                    inline
                    showCode
                    alwaysShowValue
                  />
                  <Box textAlign="right">
                    <CounterValue
                      color="palette.text.shade60"
                      fontSize={3}
                      currency={currency}
                      value={totalSpent}
                      alwaysShowSign={false}
                      alwaysShowValue
                    />
                  </Box>
                </Box>
              </Box>
            </>
          ) : null}
        </FromToWrapper>
      </Box>
    );
  }
}
