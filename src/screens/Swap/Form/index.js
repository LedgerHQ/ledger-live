// @flow

import React, { useCallback, useMemo } from "react";
import { TouchableOpacity, StyleSheet, View } from "react-native";
import { Trans } from "react-i18next";
import { useSelector } from "react-redux";
import uniq from "lodash/uniq";
import { getCurrenciesWithStatus } from "@ledgerhq/live-common/lib/exchange/swap/logic";
import type { CurrenciesStatus } from "@ledgerhq/live-common/lib/exchange/swap/logic";
import type {
  Exchange,
  ExchangeRate,
} from "@ledgerhq/live-common/lib/exchange/swap/types";
import { useNavigation, useRoute, useTheme } from "@react-navigation/native";
import Icon from "react-native-vector-icons/dist/Ionicons";
import {
  getAccountUnit,
  getAccountCurrency,
  getAccountName,
} from "@ledgerhq/live-common/lib/account";
import type {
  Account,
  AccountLike,
} from "@ledgerhq/live-common/lib/types/account";
import type {
  CryptoCurrency,
  TokenCurrency,
  Transaction,
  TransactionStatus,
} from "@ledgerhq/live-common/lib/types";
import {
  isCurrencySupported,
  findCryptoCurrencyById,
  findTokenById,
} from "@ledgerhq/live-common/lib/currencies";
import type { DeviceInfo } from "@ledgerhq/live-common/lib/types/manager";
import type { Device } from "@ledgerhq/live-common/lib/hw/actions/types";
import { isCurrencyExchangeSupported } from "@ledgerhq/live-common/lib/exchange";
import CurrencyUnitValue from "../../../components/CurrencyUnitValue";
import SectionSeparator, {
  ArrowDownCircle,
} from "../../../components/SectionSeparator";
import CurrencyIcon from "../../../components/CurrencyIcon";
import LText from "../../../components/LText";
import Button from "../../../components/Button";
import { accountsSelector } from "../../../reducers/accounts";
import { ScreenName } from "../../../const";
import { TrackScreen } from "../../../analytics";

type SelectAccountFlowTarget = "from" | "to";
export type SwapRouteParams = {
  exchange: Exchange,
  exchangeRate: ExchangeRate,
  currenciesStatus: CurrenciesStatus,
  selectableCurrencies: (CryptoCurrency | TokenCurrency)[],
  transaction?: Transaction,
  status?: TransactionStatus,
  selectedCurrency: CryptoCurrency | TokenCurrency,
  providers: any,
  installedApps: any,
  target: "from" | "to",
  deviceMeta: DeviceMeta,
  rateExpiration?: Date,
};

export type DeviceMeta = {
  result: { installed: any },
  device: Device,
  deviceInfo: DeviceInfo,
};
const Form = ({
  providers,
  deviceMeta,
  defaultAccount,
  defaultParentAccount,
}: {
  providers: any,
  deviceMeta: DeviceMeta,
  defaultAccount: ?AccountLike,
  defaultParentAccount: ?Account,
}) => {
  const { colors } = useTheme();
  const { navigate } = useNavigation();
  const { result } = deviceMeta;
  const { installed: installedApps } = result;
  const route = useRoute();
  const accounts = useSelector(accountsSelector);
  const selectableCurrencies = useSelector(state =>
    selectableCurrenciesSelector(state, { providers }),
  );
  const currenciesStatus = useMemo(
    () =>
      getCurrenciesWithStatus({
        accounts,
        installedApps,
        selectableCurrencies,
      }),
    [accounts, installedApps, selectableCurrencies],
  );

  const exchange = useMemo(
    () =>
      route.params?.exchange || {
        fromAccount: defaultAccount?.balance.gt(0) ? defaultAccount : undefined,
        fromParentAccount: defaultAccount?.balance.gt(0)
          ? defaultParentAccount
          : undefined,
      },
    [defaultAccount, defaultParentAccount, route.params],
  );
  const { fromAccount, toAccount } = exchange;
  const fromCurrency = fromAccount ? getAccountCurrency(fromAccount) : null;
  const toCurrency = toAccount ? getAccountCurrency(toAccount) : null;

  const startSelectAccountFlow = useCallback(
    (target: SelectAccountFlowTarget) => {
      navigate(ScreenName.SwapFormSelectCrypto, {
        target,
        providers,
        installedApps,
        exchange: exchange || {},
        selectableCurrencies,
        currenciesStatus,
      });
    },
    [
      navigate,
      providers,
      installedApps,
      exchange,
      selectableCurrencies,
      currenciesStatus,
    ],
  );

  const onContinue = useCallback(() => {
    navigate(ScreenName.SwapFormAmount, {
      ...route.params,
      deviceMeta,
    });
  }, [navigate, deviceMeta, route.params]);

  const canContinue = useMemo(() => {
    if (!exchange) return false;
    const { fromAccount, toAccount } = exchange;
    return fromAccount && toAccount;
  }, [exchange]);

  return (
    <View style={styles.root}>
      <TrackScreen category="Swap" name="Form" />
      <View style={styles.top}>
        <TouchableOpacity
          style={styles.accountWrapper}
          onPress={() => startSelectAccountFlow("from")}
        >
          <LText semiBold secondary style={styles.accountTitle} color="smoke">
            <Trans i18nKey={"transfer.swap.form.from"} />
          </LText>

          <View style={styles.accountNameWrapper}>
            {fromAccount ? (
              <>
                <CurrencyIcon size={16} currency={fromCurrency} />
                <LText
                  semiBold
                  style={styles.accountName}
                  numberOfLines={1}
                  ellipsizeMode="middle"
                >
                  {getAccountName(fromAccount)}
                </LText>
                <View style={{ marginTop: 4, marginLeft: 8 }}>
                  <Icon name="ios-arrow-down" size={16} color={colors.black} />
                </View>
              </>
            ) : (
              <>
                <LText
                  semiBold
                  style={styles.accountName}
                  numberOfLines={1}
                  ellipsizeMode="middle"
                >
                  <Trans i18nKey={"transfer.swap.form.fromAccount"} />
                </LText>
                <View style={{ marginTop: 4, marginLeft: 8 }}>
                  <Icon name="ios-arrow-down" size={16} color={colors.black} />
                </View>
              </>
            )}
          </View>

          {fromAccount ? (
            <LText style={styles.accountBalance} color="grey">
              <Trans i18nKey={"transfer.swap.form.balance"}>
                <CurrencyUnitValue
                  showCode
                  unit={getAccountUnit(fromAccount)}
                  value={fromAccount.balance}
                />
              </Trans>
            </LText>
          ) : null}
        </TouchableOpacity>
        <SectionSeparator noMargin>
          <ArrowDownCircle />
        </SectionSeparator>
        <TouchableOpacity
          style={styles.accountWrapper}
          onPress={() => startSelectAccountFlow("to")}
        >
          <LText semiBold secondary style={styles.accountTitle} color="smoke">
            <Trans i18nKey={"transfer.swap.form.to"} />
          </LText>

          <View style={styles.accountNameWrapper}>
            {toAccount ? (
              <>
                <CurrencyIcon size={16} currency={toCurrency} />
                <LText
                  semiBold
                  style={styles.accountName}
                  numberOfLines={1}
                  ellipsizeMode="middle"
                >
                  {getAccountName(toAccount)}
                </LText>
                <View style={{ marginTop: 4, marginLeft: 8 }}>
                  <Icon name="ios-arrow-down" size={16} color={colors.black} />
                </View>
              </>
            ) : (
              <>
                <LText semiBold style={styles.accountName}>
                  <Trans i18nKey={"transfer.swap.form.toAccount"} />
                </LText>
                <View style={{ marginTop: 4, marginLeft: 8 }}>
                  <Icon name="ios-arrow-down" size={16} color={colors.black} />
                </View>
              </>
            )}
          </View>

          {toAccount ? (
            <LText style={styles.accountBalance} color="grey">
              <Trans i18nKey={"transfer.swap.form.balance"}>
                <CurrencyUnitValue
                  showCode
                  unit={getAccountUnit(toAccount)}
                  value={toAccount.balance}
                />
              </Trans>
            </LText>
          ) : null}
        </TouchableOpacity>
      </View>
      <View style={styles.buttonWrapper}>
        <Button
          event="SwapFormAccountToAmount"
          disabled={!canContinue}
          type={"primary"}
          title={<Trans i18nKey="transfer.swap.form.button" />}
          onPress={onContinue}
          containerStyle={styles.button}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    padding: 16,
  },
  top: {
    justifyContent: "space-around",
    marginVertical: 24,
    alignItems: "center",
    flex: 1,
  },
  buttonWrapper: {},
  button: {
    width: "100%",
  },
  accountWrapper: {
    alignItems: "center",
  },
  accountTitle: {
    fontSize: 12,
    lineHeight: 14,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  accountNameWrapper: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
    marginTop: 24,
  },
  accountName: {
    fontSize: 18,
    lineHeight: 25,
    marginLeft: 8,
    flexShrink: 1,
  },
  accountBalance: {
    fontSize: 14,
    lineHeight: 19,
  },
});

const selectableCurrenciesSelector = (state, props: { providers: any }) => {
  const { providers } = props;
  if (!providers) return [];

  const allIds = uniq(
    providers.reduce(
      (ac, { supportedCurrencies }) => [...ac, ...supportedCurrencies],
      [],
    ),
  );

  const tokenCurrencies = allIds
    .map(findTokenById)
    .filter(Boolean)
    .filter(t => !t.delisted);
  const cryptoCurrencies = allIds
    .map(findCryptoCurrencyById)
    .filter(Boolean)
    .filter(isCurrencySupported);

  return [...cryptoCurrencies, ...tokenCurrencies].filter(
    isCurrencyExchangeSupported,
  );
};

export default Form;
