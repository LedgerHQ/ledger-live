import React, { useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";
import { useTranslation } from "~/context/Locale";
import { Spot } from "@ledgerhq/lumen-ui-rnative";
import { Search, Warning } from "@ledgerhq/lumen-ui-rnative/symbols";
import { useStyleSheet } from "@ledgerhq/lumen-ui-rnative/styles";
import type { AddressValidationError } from "../types";

type ErrorStateProps = Readonly<{
  errorType: AddressValidationError;
}>;

export function ErrorState({ errorType }: ErrorStateProps) {
  const { t } = useTranslation();
  const styles = useStyles();

  const errorContent = useMemo(() => {
    switch (errorType) {
      case "incorrect_format":
        return {
          title: t("newSendFlow.addressNotFound"),
          description: t("newSendFlow.errors.incorrectFormat"),
          Icon: Search,
        };
      case "wallet_not_exist":
        return {
          title: t("newSendFlow.addressNotFound"),
          description: t("newSendFlow.errors.walletNotExist"),
          Icon: Search,
        };
      case "incompatible_asset":
        return {
          title: t("newSendFlow.addressNotFound"),
          description: t("newSendFlow.errors.incompatibleAsset"),
          Icon: Warning,
        };
      default:
        return {
          title: t("newSendFlow.addressNotFound"),
          description: t("newSendFlow.addressNotFoundDescription"),
          Icon: Search,
        };
    }
  }, [errorType, t]);

  if (!errorType || errorType === "sanctioned") {
    return null;
  }

  const { title, description, Icon } = errorContent;

  return (
    <View style={styles.container}>
      <Spot appearance="icon" icon={Icon} size={72} />
      <View style={styles.textContainer}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description}>{description}</Text>
      </View>
    </View>
  );
}

const useStyles = () =>
  useStyleSheet(
    theme => ({
      container: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        padding: theme.spacings.s24,
        gap: theme.spacings.s16,
      },
      textContainer: {
        gap: theme.spacings.s8,
        alignItems: "center",
      },
      title: StyleSheet.flatten([
        theme.typographies.heading3SemiBold,
        {
          color: theme.colors.text.base,
          textAlign: "center",
        },
      ]),
      description: StyleSheet.flatten([
        theme.typographies.body2,
        {
          color: theme.colors.text.muted,
          textAlign: "center",
        },
      ]),
    }),
    [],
  );
