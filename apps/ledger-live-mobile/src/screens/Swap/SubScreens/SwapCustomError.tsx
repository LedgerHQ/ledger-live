import { Flex, Text } from "@ledgerhq/native-ui";
import React, { useMemo } from "react";
import { StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Trans, useTranslation } from "react-i18next";
import { Icons } from "@ledgerhq/native-ui";
import { useHeaderHeight } from "@react-navigation/elements";
import { SwapCustomErrorProps } from "../types";
import Button from "~/components/Button";
import useExportLogs from "~/components/useExportLogs";
import { sharedSwapTracking } from "../utils";
import { track } from "~/analytics/segment";

export default function SwapCustomError({ route }: SwapCustomErrorProps) {
  const { t } = useTranslation();
  const error = route.params.error;
  const titleKey = error && "title" in error ? error.title : undefined;
  const nameKey =
    error && "name" in error && error.name !== "CompleteExchangeError" ? error.name : undefined;
  const onExport = useExportLogs();
  const headerHeight = useHeaderHeight();

  const { title, description } = useMemo(() => {
    const errorMessage =
      error && "message" in error && typeof error.message === "string"
        ? error.message.toLowerCase()
        : "";

    if (errorMessage.includes("transaction cannot be created")) {
      track("error_message", {
        ...sharedSwapTracking,
        message: "partner_unavailable",
      });
      return {
        title: t("swapErrors.transactionCannotBeCreated.title"),
        description: t("swapErrors.transactionCannotBeCreated.description"),
      };
    }

    if (titleKey || nameKey) {
      const errorKey = titleKey || nameKey;
      const titleTranslationKey = `swapErrors.${errorKey}.title`;
      const descriptionTranslationKey = `swapErrors.${errorKey}.description`;

      const titleExists = t(titleTranslationKey) !== titleTranslationKey;
      const descriptionExists = t(descriptionTranslationKey) !== descriptionTranslationKey;

      return {
        title: titleExists ? t(titleTranslationKey) : t("swapErrors.default.title"),
        description: descriptionExists
          ? t(descriptionTranslationKey)
          : t("swapErrors.default.description"),
      };
    }
    if (error && "message" in error) {
      return {
        title: error.message,
        description: t("swapErrors.default.description"),
      };
    }
    return {
      title: t("swapErrors.default.title"),
      description: t("swapErrors.default.description"),
    };
  }, [error, nameKey, t, titleKey]);

  return (
    <SafeAreaView style={[styles.root, { bottom: headerHeight }]}>
      <Flex justifyContent="center" alignItems="center">
        <Icons.DeleteCircleFill color="red" size="XXL" />
        <Text variant="h3Inter" fontWeight="bold" fontSize={25} textAlign={"center"} mt={24}>
          {title}
        </Text>
        <Text variant="body" textAlign={"center"} testID="error-description-deviceAction" mt={16}>
          {description}

          {error && "cause" in error && error.cause?.swapCode && (
            <Trans
              i18nKey="errors.CustomError.errorCode"
              values={{ errorCode: error.cause.swapCode }}
            />
          )}
        </Text>
        <Button
          type="main"
          size="medium"
          onPress={onExport}
          alignSelf="stretch"
          title={t("common.saveLogs")}
          mt={32}
        />
      </Flex>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    display: "flex",
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
