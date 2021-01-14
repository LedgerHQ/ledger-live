// @flow

import React, { useCallback } from "react";
import { Trans } from "react-i18next";
import { getCryptoCurrencyById } from "@ledgerhq/live-common/lib/currencies";
import { useSelector } from "react-redux";
import { Image, View, StyleSheet } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NavigatorName, ScreenName } from "../../../const";
import { accountsSelector } from "../../../reducers/accounts";
import getWindowDimensions from "../../../logic/getWindowDimensions";
import stakeCosmos from "../../../images/banners/cosmosstaking.png";
import LText from "../../LText";
import Touchable from "../../Touchable";

const StakeCosmos = () => {
  const accounts = useSelector(accountsSelector);
  const slideWidth = getWindowDimensions().width - 32;
  const navigation = useNavigation();

  const onClick = useCallback(() => {
    const currency = getCryptoCurrencyById("cosmos");
    const highestBalanceAccount = accounts
      .filter(a => a.currency === currency && a.balance.gt(0))
      .sort((a, b) => b.balance.minus(a.balance).toNumber());

    if (highestBalanceAccount[0]) {
      const parentId =
        highestBalanceAccount[0].type !== "Account"
          ? highestBalanceAccount[0].parentId
          : undefined;
      navigation.navigate(ScreenName.Account, {
        accountId: highestBalanceAccount[0].id,
        parentId,
      });
    } else {
      navigation.navigate(NavigatorName.AddAccounts, {
        currency,
      });
    }
  }, [accounts, navigation]);

  return (
    <Touchable event="StakeCosmos Carousel" onPress={onClick}>
      <View style={[styles.wrapper, { width: slideWidth }]}>
        <Image style={styles.illustration} source={stakeCosmos} />
        <View>
          <LText semiBold secondary style={styles.label}>
            <Trans i18nKey={`carousel.banners.stakeCosmos.title`} />
          </LText>
          <LText primary style={styles.description}>
            <Trans i18nKey={`carousel.banners.stakeCosmos.description`} />
          </LText>
        </View>
      </View>
    </Touchable>
  );
};

const styles = StyleSheet.create({
  illustration: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 146,
    height: 93,
  },
  wrapper: {
    width: "100%",
    height: 100,
    padding: 16,
    paddingBottom: 0,
    position: "relative",
  },
  buttonWrapper: {
    display: "flex",
    flexDirection: "row",
  },
  button: {
    marginBottom: 16,
  },
  label: {
    textTransform: "uppercase",
    letterSpacing: 1,
    opacity: 0.5,
    fontSize: 10,
    lineHeight: 15,
    marginRight: 100,
  },
  description: {
    fontSize: 13,
    lineHeight: 19,
    marginTop: 8,
    marginBottom: 16,
    marginRight: 100,
  },
  layer: {
    position: "absolute",
  },
});

export default StakeCosmos;
