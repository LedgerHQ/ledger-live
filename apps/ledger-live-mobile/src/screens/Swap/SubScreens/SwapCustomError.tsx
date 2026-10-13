import { TrackScreen } from "@shared/analytics-react";
import { Flex, Text, Icons } from "@ledgerhq/native-ui";
import React, { useMemo } from "react";
import { StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useTranslation } from "~/context/Locale";
import { useHeaderHeight } from "@react-navigation/elements";
import { getExchangeErrorPresentation } from "LLM/features/WalletApiExchange/errors/getExchangeErrorPresentation";
import Button from "~/components/Button";
import useExportLogs from "~/components/useExportLogs";
import { sharedSwapTracking } from "../utils";
import { SwapCustomErrorProps } from "../types";

export default function SwapCustomError({ route }: SwapCustomErrorProps) {
  const { t } = useTranslation();
  const error = route.params.error;

  const onExport = useExportLogs();
  const headerHeight = useHeaderHeight();

  const { title, description, swapCode, correlationId } = useMemo(
    () => getExchangeErrorPresentation(error, t),
    [error, t],
  );

  return (
    <SafeAreaView style={[styles.root, { bottom: headerHeight }]}>
      <TrackScreen category="Swap" name="Swap Error Screen" {...sharedSwapTracking} {...error} />
      <Flex justifyContent="center" alignItems="center" px={6}>
        <Icons.DeleteCircleFill color="red" size="XXL" />
        <Text variant="h3Inter" fontWeight="bold" fontSize={25} textAlign={"center"} mt={24}>
          {title}
        </Text>
        <Text variant="body" textAlign={"center"} testID="error-description-deviceAction" mt={16}>
          {description}
        </Text>
        {swapCode || correlationId ? (
          <Flex bg="neutral.c20" borderRadius={8} alignSelf="stretch" p={4} mt={6} rowGap={6}>
            <ErrorBlock translationKey="swapErrors.details.code" value={swapCode} />
            <ErrorBlock translationKey="swapErrors.details.correlationId" value={correlationId} />
          </Flex>
        ) : null}
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

function ErrorBlock({ translationKey, value }: { translationKey: string; value: string | null }) {
  const { t } = useTranslation();

  if (!value) {
    return null;
  }

  return (
    <Flex flexDirection="row" justifyContent="space-between" alignItems="center">
      <Text variant="body" color="neutral.c70">
        {t(translationKey)}
      </Text>
      <Text variant="body">{value}</Text>
    </Flex>
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
