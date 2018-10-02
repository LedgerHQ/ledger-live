/* @flow */
import React, { PureComponent, Fragment } from "react";
import { View, StyleSheet } from "react-native";
import { RectButton } from "react-native-gesture-handler";
import type { Account, Operation } from "@ledgerhq/live-common/lib/types";
import { getOperationAmountNumber } from "@ledgerhq/live-common/lib/helpers/operation";
import uniq from "lodash/uniq";
import { connect } from "react-redux";
import { createStructuredSelector } from "reselect";
import { compose } from "redux";
import { translate } from "react-i18next";
import LText from "../../components/LText";
import OperationIcon from "../../components/OperationIcon";
import CurrencyUnitValue from "../../components/CurrencyUnitValue";
import CounterValue from "../../components/CounterValue";
import type { CurrencySettings } from "../../reducers/settings";
import { currencySettingsForAccountSelector } from "../../reducers/settings";
import colors from "../../colors";
import type { T } from "../../types/common";
import DataList from "./DataList";

type Props = {
  t: T,
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
    const { account, operation, t, currencySettings } = this.props;
    const amount = getOperationAmountNumber(operation);
    const valueColor = amount.isNegative() ? colors.smoke : colors.green;
    const confirmations = operation.blockHeight
      ? account.blockHeight - operation.blockHeight
      : 0;
    const uniqueSenders = uniq(operation.senders);
    const uniqueRecipients = uniq(operation.recipients);

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
          <LText style={styles.counterValue}>
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
              <LText style={[styles.confirmation, { color: colors.green }]}>
                {`${t("common:operationDetails.confirmed")} (${confirmations})`}
              </LText>
            ) : (
              <LText style={[styles.confirmation, { color: colors.grey }]}>
                {`${t(
                  "common:operationDetails.notConfirmed",
                )} (${confirmations})`}
              </LText>
            )}
          </View>
        </View>
        <RectButton style={styles.section} onPress={this.onPress}>
          <LText style={styles.sectionTitle}>
            {t("common:operationDetails.account")}
          </LText>
          <LText semiBold>{account.name}</LText>
        </RectButton>
        <View style={styles.section}>
          <LText style={styles.sectionTitle}>
            {t("common:operationDetails.date")}
          </LText>
          <LText semiBold>
            {operation.date.toLocaleDateString([], {
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
            {t("common:operationDetails.fees")}
          </LText>
          {operation.fee ? (
            <LText semiBold>
              <CurrencyUnitValue
                showCode
                unit={account.unit}
                value={operation.fee}
              />
            </LText>
          ) : (
            <LText semiBold>{t("common:operationDetails.noFees")}</LText>
          )}
        </View>
        <View style={styles.section}>
          <LText style={styles.sectionTitle}>
            {t("common:operationDetails.identifier")}
          </LText>
          <LText semiBold selectable>
            {operation.hash}
          </LText>
        </View>
        <View style={styles.section}>
          <DataList
            data={uniqueSenders}
            t={t}
            title={t("common:operationDetails.from", {
              count: uniqueSenders.length,
            })}
            titleStyle={styles.sectionTitle}
          />
        </View>
        <View style={styles.section}>
          <DataList
            data={uniqueRecipients}
            t={t}
            title={t("common:operationDetails.to", {
              count: uniqueRecipients.length,
            })}
          />
        </View>
      </Fragment>
    );
  }
}

export default compose(
  connect(mapStateToProps),
  translate(),
)(Content);

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
