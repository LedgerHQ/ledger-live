import { Flex, Icons, rgba, Text } from "@ledgerhq/native-ui";
import React from "react";
import { useTranslation } from "react-i18next";
import { Animated, StyleSheet } from "react-native";
import { View } from "react-native-animatable";
import { useTheme } from "styled-components/native";
import Circle from "~/components/Circle";
import VerticalGradientBackground from "LLM/features/Accounts/components/VerticalGradientBackground";
import useAnimatedStyle from "../ScanDeviceAccountsFooter/useAnimatedStyle";

export function CantCreateAccountAlert({ currencyName }: { currencyName: string }) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { animatedSelectableAccount: animatedContainer } = useAnimatedStyle();
  return (
    <Animated.View style={[animatedContainer, styles.cantCreateAccount]}>
      <VerticalGradientBackground stopColor={colors.warning.c70} />
      <Flex alignItems={"center"} style={styles.cantCreateAccount}>
        <View style={[styles.iconWrapper, { backgroundColor: rgba(colors.warning.c70, 0.1) }]}>
          <Circle size={24}>
            <Icons.WarningFill size="L" color={colors.warning.c70} />
          </Circle>
        </View>

        <Text style={styles.cantCreateAccountTitle}>
          {t("addAccounts.addAccountsWarning.noAccountToCreate.title", {
            replace: {
              currency: currencyName,
            },
          })}
        </Text>
      </Flex>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  cantCreateAccountTitle: {
    marginTop: 32,
    fontSize: 24,
    textAlign: "center",
    width: "100%",
    fontWeight: 600,
    fontStyle: "normal",
    lineHeight: 32.4,
    letterSpacing: 0.75,
  },
  iconWrapper: {
    height: 72,
    width: 72,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
  },
  cantCreateAccount: {
    flex: 1,
    justifyContent: "center",
  },
});
