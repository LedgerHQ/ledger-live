/* @flow */
import React, { PureComponent } from "react";
import { View, StyleSheet, Linking } from "react-native";
import type {
  Account,
  Operation,
  AccountLike,
} from "@ledgerhq/live-common/lib/types";
import { getOperationAmountNumber } from "@ledgerhq/live-common/lib/operation";
import {
  getMainAccount,
  getAccountCurrency,
  getAccountUnit,
  getAccountName,
} from "@ledgerhq/live-common/lib/account";
import uniq from "lodash/uniq";
import { connect } from "react-redux";
import { createStructuredSelector } from "reselect";
import { Trans, translate } from "react-i18next";
import type { TFunction } from "react-i18next";
import { listTokenTypesForCryptoCurrency } from "@ledgerhq/live-common/lib/data/tokens";
import { localeIds } from "../../languages";
import LText from "../../components/LText";
import OperationIcon from "../../components/OperationIcon";
import OperationRow from "../../components/OperationRow";
import CurrencyUnitValue from "../../components/CurrencyUnitValue";
import CounterValue from "../../components/CounterValue";
import Touchable from "../../components/Touchable";
import { urls } from "../../config/urls";
import Info from "../../icons/Info";
import ExternalLink from "../../icons/ExternalLink";
import type { CurrencySettings } from "../../reducers/settings";
import { currencySettingsForAccountSelector } from "../../reducers/settings";
import colors from "../../colors";
import DataList from "./DataList";
import Modal from "./Modal";
import Section, { styles as sectionStyles } from "./Section";
import byFamiliesOperationDetails from "../../generated/operationDetails";
import DefaultOperationDetailsExtra from "./Extra";

type HelpLinkProps = {
  event: string,
  title: React$Node,
  onPress: () => ?Promise<any>,
};

const HelpLink = ({ title, event, onPress }: HelpLinkProps) => (
  <Touchable onPress={onPress} event={event} style={styles.helpLinkRoot}>
    <ExternalLink size={12} color={colors.smoke} />
    <LText style={styles.helpLinkText}>{title}</LText>
  </Touchable>
);

type Props = {
  account: AccountLike,
  parentAccount: ?Account,
  operation: Operation,
  currencySettings: CurrencySettings,
  navigation: *,
  t: TFunction,
};

type State = {
  isModalOpened: boolean,
};

const mapStateToProps = createStructuredSelector({
  currencySettings: currencySettingsForAccountSelector,
});

class Content extends PureComponent<Props, State> {
  state = {
    isModalOpened: false,
  };

  onPress = () => {
    const { navigation, account, parentAccount } = this.props;

    navigation.navigate("Account", {
      accountId: account.id,
      parentId: parentAccount && parentAccount.id,
    });
  };

  onPressInfo = () => {
    this.setState({ isModalOpened: true });
  };

  onModalClose = () => {
    this.setState({ isModalOpened: false });
  };

  render() {
    const {
      account,
      parentAccount,
      operation,
      currencySettings,
      t,
    } = this.props;
    const mainAccount = getMainAccount(account, parentAccount);
    const isToken =
      listTokenTypesForCryptoCurrency(mainAccount.currency).length > 0;
    const unit = getAccountUnit(account);
    const parentUnit = getAccountUnit(mainAccount);
    const currency = getAccountCurrency(account);
    const parentCurrency = getAccountCurrency(mainAccount);
    const amount = getOperationAmountNumber(operation);
    const isNegative = amount.isNegative();
    const valueColor = isNegative ? colors.smoke : colors.green;
    const confirmations = operation.blockHeight
      ? mainAccount.blockHeight - operation.blockHeight
      : 0;
    const uniqueSenders = uniq(operation.senders);
    const uniqueRecipients = uniq(operation.recipients);
    const { extra, type } = operation;
    const { hasFailed } = operation;
    const subOperations = operation.subOperations || [];
    const internalOperations = operation.internalOperations || [];

    const shouldDisplayTo =
      uniqueRecipients.length > 0 && !!uniqueRecipients[0];

    const isConfirmed = confirmations >= currencySettings.confirmationsNb;

    const specific = byFamiliesOperationDetails[mainAccount.currency.family];
    const Extra =
      specific && specific.OperationDetailsExtra
        ? specific.OperationDetailsExtra
        : DefaultOperationDetailsExtra;

    return (
      <>
        <View style={styles.header}>
          <View style={styles.icon}>
            <OperationIcon
              size={57}
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

        {subOperations.length > 0 && account.type === "Account" && (
          <>
            <View style={[sectionStyles.wrapper, styles.infoContainer]}>
              <LText style={styles.sectionSeparator} semiBold>
                <Trans
                  i18nKey={
                    isToken
                      ? "operationDetails.tokenOperations"
                      : "operationDetails.subAccountOperations"
                  }
                />
              </LText>
              {isToken ? (
                <Touchable
                  style={styles.info}
                  onPress={this.onPressInfo}
                  event="TokenOperationsInfo"
                >
                  <Info size={12} color={colors.grey} />
                </Touchable>
              ) : null}
            </View>
            {subOperations.map((op, i) => {
              const opAccount = (account.subAccounts || []).find(
                acc => acc.id === op.accountId,
              );

              if (!opAccount) return null;

              return (
                <OperationRow
                  isSubOperation
                  key={op.id}
                  operation={op}
                  parentAccount={account}
                  account={opAccount}
                  navigation={this.props.navigation}
                  multipleAccounts
                  isLast={subOperations.length - 1 === i}
                />
              );
            })}
          </>
        )}

        {internalOperations.length > 0 && account.type === "Account" && (
          <>
            <Section
              title={t("operationDetails.internalOperations")}
              style={styles.infoContainer}
            />
            {internalOperations.map((op, i) => (
              <OperationRow
                key={op.id}
                operation={op}
                parentAccount={null}
                account={account}
                navigation={this.props.navigation}
                multipleAccounts
                isLast={internalOperations.length - 1 === i}
              />
            ))}
          </>
        )}

        {internalOperations.length > 0 || subOperations.length > 0 ? (
          <Section
            title={t("operationDetails.details", { currency: currency.name })}
            style={styles.infoContainer}
          />
        ) : null}

        <Section
          title={t("operationDetails.account")}
          value={getAccountName(account)}
          onPress={this.onPress}
        />

        <Section
          title={t("operationDetails.date")}
          value={operation.date.toLocaleDateString(localeIds, {
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        />

        {isNegative ? (
          <Section title={t("operationDetails.fees")}>
            {operation.fee ? (
              <View style={styles.feeValueContainer}>
                <LText style={sectionStyles.value} semiBold>
                  <CurrencyUnitValue
                    showCode
                    unit={parentUnit}
                    value={operation.fee}
                  />
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
                    currency={parentCurrency}
                    value={operation.fee}
                  />
                </LText>
              </View>
            ) : (
              <LText style={sectionStyles.value} semiBold>
                {t("operationDetails.noFees")}
              </LText>
            )}
          </Section>
        ) : null}

        <Section
          title={t("operationDetails.identifier")}
          value={operation.hash}
        />

        <View style={sectionStyles.wrapper}>
          <DataList
            data={uniqueSenders}
            title={
              <Trans
                i18nKey="operationDetails.from"
                count={uniqueSenders.length}
                values={{ count: uniqueSenders.length }}
              />
            }
            titleStyle={sectionStyles.title}
          />
        </View>

        {shouldDisplayTo ? (
          <View style={sectionStyles.wrapper}>
            <DataList
              data={uniqueRecipients}
              title={
                <Trans
                  i18nKey="operationDetails.to"
                  count={uniqueRecipients.length}
                  values={{ count: uniqueRecipients.length }}
                />
              }
              rightComp={
                uniqueRecipients.length > 1 ? (
                  <View style={{ marginLeft: "auto" }}>
                    <HelpLink
                      event="MultipleAddressesSupport"
                      onPress={() => Linking.openURL(urls.multipleAddresses)}
                      title={
                        <Trans i18nKey="operationDetails.multipleAddresses" />
                      }
                    />
                  </View>
                ) : null
              }
            />
          </View>
        ) : null}

        <Extra extra={extra} type={type} account={account} />

        <Modal
          isOpened={this.state.isModalOpened}
          onClose={this.onModalClose}
        />
      </>
    );
  }
}

export default translate()(connect(mapStateToProps)(Content));

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
  info: {
    marginLeft: 5,
  },
  infoContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  sectionSeparator: {
    color: colors.grey,
  },
  bulletPoint: {
    borderRadius: 50,
    height: 6,
    width: 6,
    marginRight: 8,
    alignSelf: "center",
  },
  helpLinkRoot: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  helpLinkText: {
    marginLeft: 5,
    fontSize: 12,
    textDecorationLine: "underline",
    color: colors.smoke,
  },
});
