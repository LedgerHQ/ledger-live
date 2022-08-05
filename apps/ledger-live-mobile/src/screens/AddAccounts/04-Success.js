// @flow

import React, { useCallback } from "react";
import { Trans } from "react-i18next";
import { StyleSheet, View } from "react-native";
import type { CryptoCurrency } from "@ledgerhq/live-common/types/index";

import { useTheme } from "@react-navigation/native";
import { Icons } from "@ledgerhq/native-ui";
import { ScreenName, NavigatorName } from "../../const";
import { rgba } from "../../colors";
import { TrackScreen } from "../../analytics";
import LText from "../../components/LText";
import Button from "../../components/Button";
import IconCheck from "../../icons/Check";
import CurrencyIcon from "../../components/CurrencyIcon";

type Props = {
  navigation: any,
  route: { params: RouteParams },
};

type RouteParams = {
  currency: CryptoCurrency,
  deviceId: string,
};

export default function AddAccountsSuccess({ navigation, route }: Props) {
  const { colors } = useTheme();
  const currency = route.params.currency;

  const primaryCTA = useCallback(() => {
    navigation.replace(NavigatorName.Main, {
      screen: NavigatorName.Portfolio,
      params: {
        screen: NavigatorName.PortfolioAccounts,
        params: {
          screen: ScreenName.Accounts,
          params: { search: currency.name },
        },
      },
    });
  }, [currency, navigation]);

  const secondaryCTA = useCallback(() => {
    navigation.navigate(ScreenName.AddAccountsSelectCrypto);
  }, [navigation]);

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <TrackScreen
        category="AddAccounts"
        name="Success"
        currencyName={currency.name}
      />
      <CurrencySuccess currency={currency} />
      <LText secondary semiBold style={styles.title}>
        <Trans i18nKey="addAccounts.imported" />
      </LText>
      <View style={styles.buttonsContainer}>
        <Button
          event="AddAccountsDone"
          containerStyle={styles.button}
          type="primary"
          outline={false}
          title={<Trans i18nKey="addAccounts.success.cta" />}
          onPress={primaryCTA}
        />
        <Button
          event="AddAccountsAgain"
          onPress={secondaryCTA}
          IconLeft={Icons.WalletAddMedium}
          type="lightSecondary"
          title={<Trans i18nKey="addAccounts.success.secondaryCTA" />}
        />
      </View>
    </View>
  );
}

type CurrencySuccessProps = {
  currency: CryptoCurrency,
};

function CurrencySuccess({ currency }: CurrencySuccessProps) {
  const { colors } = useTheme();
  return (
    <View
      style={[
        styles.currencySuccess,
        {
          backgroundColor: rgba(currency.color, 0.14),
        },
      ]}
    >
      <View
        style={[
          styles.outer,
          {
            backgroundColor: colors.card,
          },
        ]}
      >
        <View
          style={[
            styles.inner,
            {
              backgroundColor: colors.green,
            },
          ]}
        >
          <IconCheck size={16} color="white" />
        </View>
      </View>
      <CurrencyIcon currency={currency} size={32} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    paddingHorizontal: 20,

    alignItems: "center",
    justifyContent: "center",
  },
  currencySuccess: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  outer: {
    position: "absolute",
    top: -5,
    right: -5,
    width: 34,
    height: 34,
    borderRadius: 100,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  inner: {
    width: 26,
    height: 26,
    borderRadius: 100,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    marginTop: 32,
    marginBottom: 32,
    fontSize: 18,
  },
  desc: {
    marginTop: 16,
    marginBottom: 32,
    marginHorizontal: 32,
    textAlign: "center",
    fontSize: 14,
  },
  buttonsContainer: {
    alignSelf: "stretch",
  },
  button: {
    marginBottom: 16,
  },
});
