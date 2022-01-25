/* @flow */
import React, { useCallback } from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import SafeAreaView from "react-native-safe-area-view";
import { Trans } from "react-i18next";
import type { TypedMessageData } from "@ledgerhq/live-common/lib/families/ethereum/types";
import type { MessageData } from "@ledgerhq/live-common/lib/hw/signMessage/types";
import {
  getAccountCurrency,
  getAccountName,
} from "@ledgerhq/live-common/lib/account";
import { useSelector } from "react-redux";
import { useTheme } from "@react-navigation/native";
import { accountScreenSelector } from "../../reducers/accounts";
import { ScreenName } from "../../const";
import { TrackScreen } from "../../analytics";
import Button from "../../components/Button";
import WalletIcon from "../../icons/Wallet";
import LText from "../../components/LText";
import ParentCurrencyIcon from "../../components/ParentCurrencyIcon";

const forceInset = { bottom: "always" };

type Props = {
  navigation: any,
  route: { params: RouteParams },
};

export type RouteParams = {
  accountId: string,
  message: MessageData | TypedMessageData,
  currentNavigation?: string,
  nextNavigation?: string,
};

const defaultParams = {
  currentNavigation: ScreenName.SignSummary,
  nextNavigation: ScreenName.SignSelectDevice,
};

function SignSummary({ navigation, route: initialRoute }: Props) {
  const { colors } = useTheme();
  const route = {
    ...initialRoute,
    params: { ...defaultParams, ...initialRoute.params },
  };
  const { account } = useSelector(accountScreenSelector(route));
  const { nextNavigation, message } = route.params;

  const navigateToNext = useCallback(() => {
    navigation.navigate(nextNavigation, {
      ...route.params,
    });
  }, [navigation, nextNavigation, route.params]);

  const onContinue = useCallback(() => {
    navigateToNext();
  }, [navigateToNext]);

  return (
    <SafeAreaView
      style={[styles.root, { backgroundColor: colors.background }]}
      forceInset={forceInset}
    >
      <TrackScreen category="SignMessage" name="Summary" />
      <View style={styles.body}>
        <View style={styles.fromContainer}>
          <View
            style={[
              styles.iconContainer,
              { backgroundColor: colors.lightLive },
            ]}
          >
            <WalletIcon color={colors.live} size={16} />
          </View>
          <View style={styles.fromInnerContainer}>
            <LText style={styles.from}>
              <Trans i18nKey="walletconnect.from" />
            </LText>
            <View style={styles.headerContainer}>
              <View style={styles.headerIconContainer}>
                <ParentCurrencyIcon
                  size={18}
                  currency={account && getAccountCurrency(account)}
                />
              </View>
              <LText semiBold secondary numberOfLines={1}>
                {account && getAccountName(account)}
              </LText>
            </View>
          </View>
        </View>
        <View
          style={[styles.separator, { backgroundColor: colors.separator }]}
        />
        <ScrollView style={styles.scrollContainer}>
          <LText style={styles.message}>
            <Trans i18nKey="walletconnect.message" />
          </LText>
          <LText semiBold>
            {message.message.domain
              ? JSON.stringify(message.message)
              : message.message}
          </LText>
        </ScrollView>
      </View>
      <View style={styles.footer}>
        <Button
          event="SummaryContinue"
          type="primary"
          title={<Trans i18nKey="common.continue" />}
          containerStyle={styles.continueButton}
          onPress={onContinue}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,

    flexDirection: "column",
  },
  body: {
    flex: 1,
    paddingHorizontal: 16,
  },
  fromContainer: {
    marginBottom: 30,
    marginTop: 16,
    flexDirection: "row",
    alignItems: "center",
  },
  headerContainer: {
    flexDirection: "row",
    marginTop: 6,
  },
  headerIconContainer: {
    marginRight: 8,
    justifyContent: "center",
  },
  fromInnerContainer: {
    marginLeft: 16,
  },
  iconContainer: {
    width: 34,
    height: 34,
    borderRadius: 34,
    justifyContent: "center",
    alignItems: "center",
  },
  scrollContainer: {
    flex: 1,
    paddingBottom: 16,
  },
  from: {
    opacity: 0.5,
  },
  message: {
    opacity: 0.5,
    marginBottom: 11,
    marginTop: 33,
  },
  separator: {
    height: 1,
  },
  footer: {
    flexDirection: "column",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 16,
  },
  continueButton: {
    alignSelf: "stretch",
  },
});

export default SignSummary;
