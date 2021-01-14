/* @flow */
import React, { useCallback, useState } from "react";
import { View, StyleSheet, Linking } from "react-native";
import uniq from "lodash/uniq";
import { useSelector } from "react-redux";
import { Trans, useTranslation } from "react-i18next";
import { useNavigation, useTheme } from "@react-navigation/native";
import type {
  Account,
  Operation,
  AccountLike,
} from "@ledgerhq/live-common/lib/types";
import {
  getOperationAmountNumber,
  getOperationConfirmationNumber,
  getOperationConfirmationDisplayableNumber,
} from "@ledgerhq/live-common/lib/operation";
import {
  getMainAccount,
  getAccountCurrency,
  getAccountUnit,
  getAccountName,
} from "@ledgerhq/live-common/lib/account";
import { NavigatorName, ScreenName } from "../../const";
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
import { currencySettingsForAccountSelector } from "../../reducers/settings";
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

const HelpLink = ({ title, event, onPress }: HelpLinkProps) => {
  const { colors } = useTheme();
  return (
    <Touchable onPress={onPress} event={event} style={styles.helpLinkRoot}>
      <ExternalLink size={12} color={colors.smoke} />
      <LText style={styles.helpLinkText} color="smoke">
        {title}
      </LText>
    </Touchable>
  );
};
type Props = {
  account: AccountLike,
  parentAccount: ?Account,
  operation: Operation,
};

export default function Content({ account, parentAccount, operation }: Props) {
  const { colors } = useTheme();
  const navigation = useNavigation();
  const { t } = useTranslation();
  const [isModalOpened, setIsModalOpened] = useState(false);

  const onPress = useCallback(() => {
    navigation.navigate(NavigatorName.Accounts);
    // setTimeout is the way to make sure that it navigates to accounts screen first
    // then stack account screen on top
    setTimeout(() =>
      navigation.navigate(ScreenName.Account, {
        accountId: account.id,
        parentId: parentAccount && parentAccount.id,
      }),
    );
  }, [account.id, navigation, parentAccount]);

  const onPressInfo = useCallback(() => {
    setIsModalOpened(true);
  }, []);

  const onModalClose = useCallback(() => {
    setIsModalOpened(false);
  }, []);

  const mainAccount = getMainAccount(account, parentAccount);
  const currencySettings = useSelector(s =>
    currencySettingsForAccountSelector(s, { account: mainAccount }),
  );
  const currency = getAccountCurrency(account);
  const isToken = currency.type === "TokenCurrency";
  const unit = getAccountUnit(account);
  const parentUnit = getAccountUnit(mainAccount);

  const parentCurrency = getAccountCurrency(mainAccount);
  const amount = getOperationAmountNumber(operation);
  const isNegative = amount.isNegative();
  const valueColor = isNegative ? colors.smoke : colors.green;
  const confirmations = getOperationConfirmationNumber(operation, mainAccount);
  const confirmationsString = getOperationConfirmationDisplayableNumber(
    operation,
    mainAccount,
  );
  const uniqueSenders = uniq(operation.senders);
  const uniqueRecipients = uniq(operation.recipients);
  const { extra, type } = operation;
  const { hasFailed } = operation;
  const subOperations = operation.subOperations || [];
  const internalOperations = operation.internalOperations || [];

  const shouldDisplayTo = uniqueRecipients.length > 0 && !!uniqueRecipients[0];

  const isConfirmed = confirmations >= currencySettings.confirmationsNb;

  const specific = byFamiliesOperationDetails[mainAccount.currency.family];
  const urlFeesInfo =
    specific && specific.getURLFeesInfo && specific.getURLFeesInfo(operation);
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

        {hasFailed || amount.isZero() ? null : (
          <LText
            semiBold
            numberOfLines={1}
            style={[styles.currencyUnitValue, { color: valueColor }]}
          >
            <CurrencyUnitValue
              showCode
              disableRounding={true}
              unit={unit}
              value={amount}
              alwaysShowSign
            />
          </LText>
        )}

        {hasFailed || amount.isZero() ? null : (
          <LText semiBold style={styles.counterValue} color="smoke">
            <CounterValue
              showCode
              alwaysShowSign
              currency={currency}
              value={amount}
              date={operation.date}
              subMagnitude={1}
            />
          </LText>
        )}

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
              {confirmationsString && `(${confirmationsString})`}
            </LText>
          ) : (
            <LText style={[styles.confirmation, { color: colors.grey }]}>
              <Trans i18nKey="operationDetails.notConfirmed" />{" "}
              {confirmationsString && `(${confirmationsString})`}
            </LText>
          )}
        </View>
      </View>

      {subOperations.length > 0 && account.type === "Account" && (
        <>
          <View style={[sectionStyles.wrapper, styles.infoContainer]}>
            <LText color="grey" semiBold>
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
                onPress={onPressInfo}
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
        onPress={onPress}
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

      {isNegative || operation.fee ? (
        <Section
          title={t("operationDetails.fees")}
          headerRight={
            urlFeesInfo ? (
              <View>
                <HelpLink
                  event="MultipleAddressesSupport"
                  onPress={() => Linking.openURL(urls.multipleAddresses)}
                  title={t("common.learnMore")}
                />
              </View>
            ) : (
              undefined
            )
          }
        >
          {operation.fee ? (
            <View style={styles.feeValueContainer}>
              <LText style={sectionStyles.value} semiBold>
                <CurrencyUnitValue
                  showCode
                  unit={parentUnit}
                  value={operation.fee}
                />
              </LText>
              <LText style={styles.feeCounterValue} color="smoke" semiBold>
                ≈
              </LText>
              <LText style={styles.feeCounterValue} color="smoke" semiBold>
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
        isOpened={isModalOpened}
        onClose={onModalClose}
        currency={currency}
      />
    </>
  );
}

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
  feeCounterValue: {
    marginLeft: 16,
  },
  currencyUnitValue: {
    paddingHorizontal: 8,
    fontSize: 20,
    marginBottom: 8,
  },
  counterValue: {
    fontSize: 14,
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
  },
});
