import React, { useCallback } from "react";
import { StyleSheet } from "react-native";
import { Flex, Icons, rgba, Text } from "@ledgerhq/native-ui";
import { useTheme } from "styled-components/native";
import { ScreenName } from "~/const";
import SafeAreaView from "~/components/SafeAreaView";
import Circle from "~/components/Circle";
import CloseWithConfirmation from "LLM/components/CloseWithConfirmation";
import VerticalGradientBackground from "LLM/features/Accounts/components/VerticalGradientBackground";
import type { StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import { Trans, useTranslation } from "~/context/Locale";
import { TrackScreen } from "~/analytics";
import type { AleoViewKeyFlowParamList } from "./types";

type Props = StackNavigatorProps<AleoViewKeyFlowParamList, ScreenName.AleoViewKeyRejected>;

export default function ViewKeyRejectedScreen({ route, navigation }: Props) {
  const { colors, space } = useTheme();
  const { t } = useTranslation();
  const { currency, onCloseNavigation } = route.params;
  const statusColor = colors.warning.c70;

  const handleClose = useCallback(() => {
    if (typeof onCloseNavigation === "function") {
      onCloseNavigation();
      return;
    }
    navigation.getParent()?.goBack();
  }, [navigation, onCloseNavigation]);

  return (
    <SafeAreaView edges={["left", "right", "bottom", "top"]} isFlex>
      <TrackScreen category="Cant add a new account" />
      <VerticalGradientBackground stopColor={statusColor} />
      <Flex alignItems="center" pt={space[10]} flex={1}>
        <Circle size={24} bg={rgba(statusColor, 0.05)} style={styles.iconWrapper}>
          <Icons.WarningFill size="L" color={statusColor} />
        </Circle>
        <Text style={styles.title}>
          <Trans
            i18nKey="aleo.addAccount.warnings.noAccountsAddedWarning.title"
            values={{ currency: currency.name }}
          />
        </Text>
        <Text style={styles.desc} variant="bodyLineHeight" color="neutral.c70">
          <Trans i18nKey="aleo.addAccount.warnings.noAccountsAddedWarning.description" />
        </Text>
      </Flex>
      <Flex px={6} pb={6}>
        <CloseWithConfirmation
          showButton
          buttonText={t("addAccounts.addAccountsSuccess.ctaClose")}
          onClose={handleClose}
        />
      </Flex>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  title: {
    marginTop: 16,
    fontSize: 24,
    textAlign: "center",
    width: "100%",
    fontWeight: "600",
    fontStyle: "normal",
    lineHeight: 32.4,
    letterSpacing: 0.75,
  },
  desc: {
    marginTop: 16,
    marginBottom: 32,
    marginHorizontal: 32,
    textAlign: "center",
    fontSize: 14,
    lineHeight: 24,
  },
  iconWrapper: {
    height: 72,
    width: 72,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
  },
});
