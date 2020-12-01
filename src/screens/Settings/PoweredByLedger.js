/* @flow */
import React, { useRef, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useNavigation } from "@react-navigation/native";
import { View, StyleSheet, TouchableWithoutFeedback } from "react-native";
import LText from "../../components/LText";
import colors from "../../colors";
import LedgerLogoRec from "../../icons/LedgerLogoRec";
import timer from "../../timer";
import { NavigatorName, ScreenName } from "../../const";

export default function PoweredByLedger({
  onTriggerDebug,
  hideTabNavigation,
}: {
  onTriggerDebug?: () => any,
  hideTabNavigation?: boolean,
}) {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const count = useRef(0);
  const onTimeout = (): void => {
    timer.timeout(() => {
      count.current = 0;
    }, 1000);
  };

  const debugTimeout = useRef(onTimeout);

  const openDebugMenu = useCallback(() => {
    navigation.navigate(NavigatorName.Base, {
      screen: NavigatorName.Main,
      params: {
        hideTabNavigation,
        screen: NavigatorName.Settings,
        params: {
          screen: ScreenName.DebugSettings,
        },
      },
    });
  }, [hideTabNavigation, navigation]);

  const onDebugHiddenPress = useCallback((): void => {
    if (debugTimeout) debugTimeout.current();
    count.current++;
    if (count.current > 5) {
      count.current = 0;
      onTriggerDebug ? onTriggerDebug() : openDebugMenu();
    } else {
      onTimeout();
    }
  }, [onTriggerDebug, openDebugMenu]);

  return (
    <TouchableWithoutFeedback onPress={onDebugHiddenPress}>
      <View style={styles.container}>
        <LText secondary semiBold style={styles.textStyle}>
          {t("common.poweredBy")}
        </LText>
        <View style={styles.iconStyle}>
          <LedgerLogoRec height={17} width={68} color={colors.grey} />
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 20,
    flexDirection: "row",
    justifyContent: "center",
  },
  textStyle: {
    justifyContent: "center",
    color: colors.grey,
    fontSize: 12,
  },
  iconStyle: {
    marginLeft: 5,
    alignSelf: "flex-end",
  },
});
