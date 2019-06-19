/* @flow */
import React, { PureComponent, Fragment } from "react";
import { View, StyleSheet } from "react-native";
import { RectButton } from "react-native-gesture-handler";
import type {
  Account,
  TokenAccount,
  Operation,
} from "@ledgerhq/live-common/lib/types";
import { getOperationAmountNumber } from "@ledgerhq/live-common/lib/operation";
import {
  getMainAccount,
  getAccountCurrency,
  getAccountUnit,
} from "@ledgerhq/live-common/lib/account";
import uniq from "lodash/uniq";
import { connect } from "react-redux";
import { createStructuredSelector } from "reselect";
import { Trans } from "react-i18next";
import { localeIds } from "../../languages";
import LText from "../../components/LText";
import OperationIcon from "../../components/OperationIcon";
import CurrencyUnitValue from "../../components/CurrencyUnitValue";
import CounterValue from "../../components/CounterValue";
import type { CurrencySettings } from "../../reducers/settings";
import { currencySettingsForAccountSelector } from "../../reducers/settings";
import colors from "../../colors";
import DataList from "./DataList";

type Props = {
  account: Account | TokenAccount,
  parentAccount: ?Account,
  operation: Operation,
  currencySettings: CurrencySettings,
  navigation: *,
};

const mapStateToProps = createStructuredSelector({
  currencySettings: currencySettingsForAccountSelector,
});

class Content extends PureComponent<Props, *> {
  onPress = () => {
    const { navigation, account } = this.props;
    navigation.navigate("Account", {
      accountId: account.id,
    });
  };

  render() {
    const { account, parentAccount, operation, currencySettings } = this.props;
    const mainAccount = getMainAccount(account, parentAccount);
    const unit = getAccountUnit(account);
    const currency = getAccountCurrency(account);
    const amount = getOperationAmountNumber(operation);
    const valueColor = amount.isNegative() ? colors.smoke : colors.green;
    const confirmations = operation.blockHeight
      ? mainAccount.blockHeight - operation.blockHeight
      : 0;
    const uniqueSenders = uniq(operation.senders);
    const uniqueRecipients = uniq(operation.recipients);
    const { extra } = operation;
    const { hasFailed } = operation;

    const isConfirmed = confirmations >= currencySettings.confirmationsNb;
    return (
      <Fragment>
        <View style={styles.header}>
          <View style={styles.icon}>
            <OperationIcon
              size={40}
              operation={operation}
              account={account}
              parentAccount={parentAccount}
            />
          </View>
          <LText
            tertiary
            numberOfLines={1}
            style={[styles.currencyUnitValue, { color: valueColor }]}
          >
            {hasFailed ? null : (
              <CurrencyUnitValue
                showCode
                disableRounding={true}
                unit={unit}
                value={amount}
                alwaysShowSign
              />
            )}
          </LText>
          <LText tertiary style={styles.counterValue}>
            {hasFailed ? null : (
              <CounterValue
                showCode
                alwaysShowSign
                currency={currency}
                value={amount}
                date={operation.date}
                subMagnitude={1}
              />
            )}
          </LText>
          <View style={styles.confirmationContainer}>
            <View
              style={[
                styles.bulletPoint,
                {
                  backgroundColor: hasFailed
                    ? colors.alert
                    : isConfirmed
                    ? colors.green
                    : colors.grey,
                },
              ]}
            />
            {hasFailed ? (
              <LText style={[styles.confirmation, { color: colors.alert }]}>
                <Trans i18nKey="operationDetails.failed" />
              </LText>
            ) : isConfirmed ? (
              <LText
                semiBold
                style={[styles.confirmation, { color: colors.green }]}
              >
                <Trans i18nKey="operationDetails.confirmed" />{" "}
                {`(${confirmations})`}
              </LText>
            ) : (
              <LText style={[styles.confirmation, { color: colors.grey }]}>
                <Trans i18nKey="operationDetails.notConfirmed" />{" "}
                {`(${confirmations})`}
              </LText>
            )}
          </View>
        </View>
        <RectButton style={styles.section} onPress={this.onPress}>
          <LText style={styles.sectionTitle}>
            <Trans i18nKey="operationDetails.account" />
          </LText>
          <LText style={styles.sectionValue} semiBold>
            {account.type === "Account" ? account.name : currency.name}
          </LText>
        </RectButton>
        <View style={styles.section}>
          <LText style={styles.sectionTitle}>
            <Trans i18nKey="operationDetails.date" />
          </LText>
          <LText style={styles.sectionValue} semiBold>
            {operation.date.toLocaleDateString(localeIds, {
              year: "numeric",
              month: "long",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </LText>
        </View>
        <View style={styles.section}>
          <LText style={styles.sectionTitle}>
            <Trans i18nKey="operationDetails.fees" />
          </LText>
          {operation.fee ? (
            <View style={styles.feeValueContainer}>
              <LText style={styles.sectionValue} semiBold>
                <CurrencyUnitValue showCode unit={unit} value={operation.fee} />
              </LText>
              <LText style={styles.feeCounterValue} semiBold>
                ≈
              </LText>
              <LText style={styles.feeCounterValue} semiBold>
                <CounterValue
                  showCode
                  disableRounding={true}
                  date={operation.date}
                  subMagnitude={1}
                  currency={currency}
                  value={operation.fee}
                />
              </LText>
            </View>
          ) : (
            <LText style={styles.sectionValue} semiBold>
              <Trans i18nKey="operationDetails.noFees" />
            </LText>
          )}
        </View>
        <View style={styles.section}>
          <LText style={styles.sectionTitle}>
            <Trans i18nKey="operationDetails.identifier" />
          </LText>
          <LText style={styles.sectionValue} semiBold selectable>
            {operation.hash}
          </LText>
        </View>
        <View style={styles.section}>
          <DataList
            data={uniqueSenders}
            title={
              <Trans
                i18nKey="operationDetails.from"
                count={uniqueSenders.length}
                values={{ count: uniqueSenders.length }}
              />
            }
            titleStyle={styles.sectionTitle}
          />
        </View>
        <View style={styles.section}>
          <DataList
            data={uniqueRecipients}
            title={
              <Trans
                i18nKey="operationDetails.to"
                count={uniqueRecipients.length}
                values={{ count: uniqueRecipients.length }}
              />
            }
          />
        </View>
        {Object.entries(extra).map(([key, value]) => (
          <View style={styles.section} key={key}>
            <LText style={styles.sectionTitle}>
              <Trans i18nKey={`operationDetails.extra.${key}`} defaults={key} />
            </LText>
            <LText semiBold selectable>
              {value}
            </LText>
          </View>
        ))}
      </Fragment>
    );
  }
}

export default connect(mapStateToProps)(Content);

const styles = StyleSheet.create({
  root: {
    borderBottomWidth: 1,
    borderColor: "#eee",
    paddingTop: 20,
    maxHeight: 550,
  },
  header: {
    alignItems: "center",
  },
  icon: {
    marginBottom: 16,
  },
  feeValueContainer: {
    flexDirection: "row",
  },
  feeSeparator: {
    marginHorizontal: 16,
    color: colors.smoke,
  },
  feeCounterValue: {
    marginLeft: 16,
    color: colors.smoke,
  },

  currencyUnitValue: {
    paddingHorizontal: 8,
    fontSize: 20,
    marginBottom: 8,
    color: colors.smoke,
  },
  counterValue: {
    fontSize: 14,
    color: colors.smoke,
    marginBottom: 16,
  },
  confirmationContainer: {
    flexDirection: "row",
    marginBottom: 24,
    justifyContent: "center",
  },
  confirmation: {
    fontSize: 16,
  },
  section: {
    padding: 16,
    color: colors.darkBlue,
  },
  sectionTitle: {
    fontSize: 14,
    color: colors.grey,
    marginBottom: 8,
  },
  sectionValue: {
    color: colors.darkBlue,
  },
  bulletPoint: {
    borderRadius: 50,
    height: 6,
    width: 6,
    marginRight: 8,
    alignSelf: "center",
  },
});
