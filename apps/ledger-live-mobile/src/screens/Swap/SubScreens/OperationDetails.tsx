import React, { useCallback, useMemo } from "react";
import { Icon, Text } from "@ledgerhq/native-ui";
import { Trans } from "react-i18next";
import { useSelector } from "react-redux";
import { useTheme } from "@react-navigation/native";
import Config from "react-native-config";
import { ScrollView, StyleSheet, View, Linking, TouchableOpacity } from "react-native";
import { getDefaultExplorerView, getTransactionExplorer } from "@ledgerhq/live-common/explorers";
import {
  getAccountName,
  getAccountUnit,
  getAccountCurrency,
} from "@ledgerhq/live-common/account/helpers";
import { getProviderName } from "@ledgerhq/live-common/exchange/swap/utils/index";
import { flattenAccountsSelector } from "~/reducers/accounts";
import CurrencyUnitValue from "~/components/CurrencyUnitValue";
import LText from "~/components/LText";
import SectionSeparator from "~/components/SectionSeparator";
import TooltipLabel from "~/components/TooltipLabel";
import CurrencyIcon from "~/components/CurrencyIcon";
import { urls } from "~/utils/urls";
import ExternalLink from "~/icons/ExternalLink";
import FormatDate from "~/components/DateFormat/FormatDate";
import { SwapStatusIndicator, getStatusColor } from "../SwapStatusIndicator";
import Footer from "../../OperationDetails/Footer";
import { OperationDetailsParamList } from "../types";

export function OperationDetails({ route }: OperationDetailsParamList) {
  const { swapOperation } = route.params;
  const { swapId, provider, toAccountId, fromAccountId, fromAmount, toAmount, operation } =
    swapOperation;
  const accounts = useSelector(flattenAccountsSelector);
  const fromAccount = useMemo(
    () => accounts.find(a => a.id === fromAccountId),
    [accounts, fromAccountId],
  );
  const toAccount = useMemo(
    () => accounts.find(a => a.id === toAccountId),
    [accounts, toAccountId],
  );

  const { colors } = useTheme();
  const swap = fromAccount && fromAccount.swapHistory.find(s => s.swapId === swapId);
  const status = Config.DEBUG_SWAP_STATUS || swap?.status;

  const fromCurrency = fromAccount && getAccountCurrency(fromAccount);
  const toCurrency = toAccount && getAccountCurrency(toAccount);
  const statusColorKey = status && getStatusColor(status, colors, true);
  const dotStyles = {
    backgroundColor: colors[statusColorKey as keyof typeof colors],
  };
  const textColorStyles = {
    color: colors[statusColorKey as keyof typeof colors],
  };

  const url =
    fromCurrency?.type === "CryptoCurrency" &&
    getTransactionExplorer(getDefaultExplorerView(fromCurrency), operation.hash);

  const openProvider = useCallback(() => {
    Linking.openURL(urls.swap.providers[provider as keyof typeof urls.swap.providers].main);
  }, [provider]);

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollViewContent}>
        {status ? <SwapStatusIndicator status={status} /> : null}
        {fromAccount && (
          <LText style={styles.fromAmount} color="grey">
            <CurrencyUnitValue
              alwaysShowSign
              showCode
              unit={getAccountUnit(fromAccount!)}
              value={fromAmount.times(-1)}
            />
          </LText>
        )}
        <View style={styles.arrow}>
          <Icon name="ArrowBottom" size={30} color="neutral.c70" />
        </View>
        <LText style={styles.toAmount} color={statusColorKey}>
          {toAccount ? (
            <CurrencyUnitValue
              alwaysShowSign
              showCode
              unit={getAccountUnit(toAccount)}
              value={toAmount}
            />
          ) : null}
        </LText>
        <View style={styles.statusTextWrapper}>
          <View style={[styles.statusDot, dotStyles]} />
          <TooltipLabel
            label={status}
            style={{ ...styles.statusText, ...textColorStyles }}
            color={statusColorKey}
            tooltip={<Trans i18nKey={`transfer.swap.operationDetails.statusTooltips.${status}`} />}
          />
        </View>
        <View style={styles.fieldsWrapper}>
          <LText style={styles.label} color="grey">
            <Trans i18nKey={"transfer.swap.operationDetails.swapId"} />
          </LText>
          <LText selectable style={styles.value}>
            {swapId}
          </LText>
          <LText style={styles.label} color="grey">
            <Trans i18nKey={"transfer.swap.operationDetails.provider"} />
          </LText>
          <TouchableOpacity style={styles.providerLinkContainer} onPress={openProvider}>
            <Text paddingRight={2} color="primary.c100">
              {getProviderName(provider)}
            </Text>
            <ExternalLink size={11} color={colors.live} />
          </TouchableOpacity>
          <LText style={styles.label} color="grey">
            <Trans i18nKey={"transfer.swap.operationDetails.date"} />
          </LText>
          <LText style={styles.value}>
            <FormatDate date={operation.date} />
          </LText>

          <SectionSeparator style={{ marginBottom: 32 }} />

          <LText style={styles.label} color="grey">
            <Trans i18nKey={"transfer.swap.operationDetails.from"} />
          </LText>
          <View style={styles.account}>
            {fromCurrency && <CurrencyIcon size={16} currency={fromCurrency} />}
            {fromAccount && (
              <LText numberOfLines={1} ellipsizeMode="middle" semiBold style={styles.accountName}>
                {getAccountName(fromAccount)}
              </LText>
            )}
          </View>
          <LText style={styles.label} color="grey">
            <Trans i18nKey={"transfer.swap.operationDetails.fromAmount"} />
          </LText>
          {fromAccount && (
            <LText style={styles.value}>
              <CurrencyUnitValue showCode unit={getAccountUnit(fromAccount)} value={fromAmount} />
            </LText>
          )}

          <SectionSeparator style={{ marginBottom: 32 }} />

          <LText style={styles.label} color="grey">
            <Trans i18nKey={"transfer.swap.operationDetails.to"} />
          </LText>
          <View style={styles.account}>
            {toCurrency ? <CurrencyIcon size={16} currency={toCurrency} /> : null}
            {toAccount ? (
              <LText numberOfLines={1} ellipsizeMode="middle" semiBold style={styles.accountName}>
                {getAccountName(toAccount)}
              </LText>
            ) : null}
          </View>
          <LText style={styles.label} color="grey">
            <Trans i18nKey={"transfer.swap.operationDetails.toAmount"} />
          </LText>
          <LText style={styles.value}>
            {toAccount ? (
              <CurrencyUnitValue showCode unit={getAccountUnit(toAccount)} value={toAmount} />
            ) : null}
          </LText>
        </View>
      </ScrollView>
      {url && fromCurrency ? <Footer url={url} currency={fromCurrency} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    padding: 24,
    alignItems: "center",
  },
  providerLinkContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 32,
  },
  providerLink: {
    textTransform: "capitalize",
    fontSize: 13,
    lineHeight: 22,
    textAlign: "center",

    marginRight: 6,
  },
  status: {
    height: 54,
    width: 54,
    borderRadius: 54,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  statusTextWrapper: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    marginTop: 24,
  },
  statusDot: {
    height: 6,
    width: 6,
    marginRight: 8,
    borderRadius: 6,
    backgroundColor: "grey",
  },
  statusText: {
    fontSize: 16,
    lineHeight: 22,
    textTransform: "capitalize",
  },
  arrow: {
    marginVertical: 8,
  },
  toAmount: {
    fontSize: 20,
    lineHeight: 24,
  },
  fromAmount: {
    marginTop: 24,
    fontSize: 20,
    lineHeight: 24,
  },
  fieldsWrapper: {
    paddingTop: 32,
    alignSelf: "stretch",
    alignItems: "flex-start",
  },
  label: {
    marginBottom: 8,

    fontSize: 14,
    lineHeight: 19,
  },
  value: {
    marginBottom: 32,
    fontSize: 14,
    lineHeight: 19,
  },
  account: {
    marginBottom: 32,
    flexDirection: "row",
    alignItems: "center",
  },
  accountName: {
    flex: 1,
    marginLeft: 8,
  },
});
