/* @flow */
import React, { PureComponent, Fragment } from "react";
import { View, StyleSheet } from "react-native";
import { RectButton } from "react-native-gesture-handler";
import type { Account, Operation } from "@ledgerhq/live-common/lib/types";
import { getOperationAmountNumber } from "@ledgerhq/live-common/lib/operation";
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
  account: Account,
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
    const { account, operation, currencySettings } = this.props;
    const amount = getOperationAmountNumber(operation);
    const valueColor = amount.isNegative() ? colors.smoke : colors.green;
    const confirmations = operation.blockHeight
      ? account.blockHeight - operation.blockHeight
      : 0;
    const uniqueSenders = uniq(operation.senders);
    const uniqueRecipients = uniq(operation.recipients);
    const { extra } = operation;

    const isConfirmed = confirmations >= currencySettings.confirmationsNb;
    return (
      <Fragment>
        <View style={styles.header}>
          <View style={styles.icon}>
            <OperationIcon size={20} containerSize={40} type={operation.type} />
          </View>
          <LText
            tertiary
            style={[styles.currencyUnitValue, { color: valueColor }]}
          >
            <CurrencyUnitValue
              showCode
              unit={account.unit}
              value={amount}
              alwaysShowSign
            />
          </LText>
          <LText tertiary style={styles.counterValue}>
            <CounterValue
              showCode
              alwaysShowSign
              currency={account.currency}
              value={amount}
            />
          </LText>
          <View style={styles.confirmationContainer}>
            <View
              style={[
                styles.bulletPoint,
                { backgroundColor: isConfirmed ? colors.green : colors.grey },
              ]}
            />
            {isConfirmed ? (
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
          <LText semiBold>{account.name}</LText>
        </RectButton>
        <View style={styles.section}>
          <LText style={styles.sectionTitle}>
            <Trans i18nKey="operationDetails.date" />
          </LText>
          <LText semiBold>
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
            <View>
            <LText semiBold>
                <CurrencyUnitValue
                  showCode
                  unit={account.unit}
                  value={operation.fee}
                />
              </LText>
              <LText>
                <CounterValue
                showCode
                currency={account.currency}
                value={operation.fee}
                />
              </LText>
            </View>
          ) : (
            <LText semiBold>
              <Trans i18nKey="operationDetails.noFees" />
            </LText>
          )}
        </View>
        <View style={styles.section}>
          <LText style={styles.sectionTitle}>
            <Trans i18nKey="operationDetails.identifier" />
          </LText>
          <LText semiBold selectable>
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
  currencyUnitValue: {
    fontSize: 20,
    marginBottom: 8,
    color: colors.smoke,
  },
  counterValue: {
    fontSize: 14,
    color: colors.grey,
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
  },
  sectionTitle: {
    fontSize: 14,
    color: colors.grey,
    marginBottom: 8,
  },
  bulletPoint: {
    borderRadius: 50,
    height: 6,
    width: 6,
    marginRight: 8,
    alignSelf: "center",
  },
});
