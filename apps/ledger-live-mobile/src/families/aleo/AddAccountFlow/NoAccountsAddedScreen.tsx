import React, { useCallback } from "react";
import { StyleSheet } from "react-native";
import { Box, Text } from "@ledgerhq/lumen-ui-rnative";
import { WarningFill } from "@ledgerhq/lumen-ui-rnative/symbols";
import { useTheme } from "styled-components/native";
import { ScreenName } from "~/const";
import SafeAreaView from "~/components/SafeAreaView";
import CloseWithConfirmation from "LLM/components/CloseWithConfirmation";
import VerticalGradientBackground from "LLM/features/Accounts/components/VerticalGradientBackground";
import type { StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import { Trans, useTranslation } from "~/context/Locale";
import { TrackScreen } from "~/analytics";
import type { AleoViewKeyFlowParamList } from "./types";

type Props = StackNavigatorProps<AleoViewKeyFlowParamList, ScreenName.AleoNoAccountsAdded>;

export default function NoAccountsAddedScreen({ route }: Props) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { currency, onCloseNavigation } = route.params;
  const statusColor = colors.warning.c70;

  const handleClose = useCallback(() => {
    onCloseNavigation?.();
  }, [onCloseNavigation]);

  return (
    <SafeAreaView edges={["left", "right", "bottom", "top"]} isFlex>
      <TrackScreen category="AleoAddAccountFlow" name="No accounts added" />
      <VerticalGradientBackground stopColor={statusColor} />
      <Box lx={{ backgroundColor: "warning", marginTop: "s96" }} style={styles.iconWrapper}>
        <WarningFill size={40} color="warning" />
      </Box>
      <Box
        lx={{ alignItems: "center", justifyContent: "flex-start", paddingHorizontal: "s20" }}
        style={styles.textContainer}
      >
        <Text style={styles.title} lx={{ color: "base" }}>
          <Trans
            i18nKey="aleo.addAccount.stepNoAccountsAdded.title"
            values={{ currency: currency.name }}
          />
        </Text>
        <Text style={styles.desc} lx={{ color: "muted" }}>
          <Trans i18nKey="aleo.addAccount.stepNoAccountsAdded.description" />
        </Text>
      </Box>
      <Box lx={{ paddingHorizontal: "s16", rowGap: "s16" }}>
        <CloseWithConfirmation
          showButton
          buttonText={t("addAccounts.addAccountsSuccess.ctaClose")}
          onClose={handleClose}
        />
      </Box>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  title: {
    marginTop: 32,
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
    fontSize: 14,
    width: "100%",
    lineHeight: 23.8,
    fontWeight: "500",
    textAlign: "center",
    alignSelf: "stretch",
  },
  iconWrapper: {
    height: 72,
    width: 72,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
  },
  textContainer: {
    flex: 1,
  },
});
