import { Flex, Text, Icons } from "@ledgerhq/native-ui";
import React, { useMemo } from "react";
import { StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Trans, useTranslation } from "react-i18next";
import type { TFunction } from "i18next";
import { useHeaderHeight } from "@react-navigation/elements";
import get from "lodash/get";
import random from "lodash/random";
import times from "lodash/times";
import Button from "~/components/Button";
import useExportLogs from "~/components/useExportLogs";
import { sharedSwapTracking } from "../utils";
import { TrackScreen } from "~/analytics";
import { SwapCustomErrorProps } from "../types";

const generateRandomString = (numberOfChars: number = 4): string => {
  return times(numberOfChars, () => random(35).toString(36))
    .join("")
    .toUpperCase();
};

type SwapErrorCopy = {
  title: string;
  description: string;
  swapCode: string | null;
};

const DEFAULT_ERROR_KEY = "swapErrors.default";

const translateOrNull = (t: TFunction, key: string): string | null => {
  const translation = t(key);
  return translation === key ? null : translation;
};

const getDefaultCopy = (t: TFunction, swapCode: string | null): SwapErrorCopy => ({
  title: t(`${DEFAULT_ERROR_KEY}.title`),
  description: t(`${DEFAULT_ERROR_KEY}.description`),
  swapCode,
});

const resolveMessageKeyCopy = (
  messageKey: string | undefined,
  t: TFunction,
): SwapErrorCopy | null => {
  if (!messageKey) return null;

  switch (messageKey) {
    case "WRONG_OR_EXPIRED_RATE_ID":
      return {
        title: t("swapErrors.swapRateExpiredError.title"),
        description: t("swapErrors.swapRateExpiredError.description"),
        swapCode: null,
      };
    case "TRANSACTION_CANNOT_BE_CREATED":
      return {
        title: t("swapErrors.transactionCannotBeCreated.title"),
        description: t("swapErrors.transactionCannotBeCreated.description", {
          randomCode: generateRandomString(),
        }),
        swapCode: null,
      };
    case "SWAP_QUOTE_LOW_LIQUIDITY":
      return {
        title: t("swapErrors.swapQuoteLowLiquidity.title"),
        description: t("swapErrors.swapQuoteLowLiquidity.description", {
          randomCode: generateRandomString(),
        }),
        swapCode: null,
      };
    default:
      return null;
  }
};

const resolveErrorKeyCopy = (
  errorKey: string | undefined,
  t: TFunction,
  swapCode: string | null,
): SwapErrorCopy | null => {
  if (!errorKey) return null;

  const title = translateOrNull(t, `swapErrors.${errorKey}.title`);
  const description = translateOrNull(t, `swapErrors.${errorKey}.description`);

  if (!title && !description) return null;

  return {
    title: title ?? t("swapErrors.default.title"),
    description: description ?? t("swapErrors.default.description"),
    swapCode,
  };
};

const resolveFallbackCopy = (
  error: SwapCustomErrorProps["route"]["params"]["error"],
  t: TFunction,
  swapCode: string | null,
): SwapErrorCopy => {
  if (error && "message" in error && typeof error.message === "string") {
    return {
      title: error.message,
      description: t("swapErrors.default.description"),
      swapCode,
    };
  }

  return getDefaultCopy(t, swapCode);
};

export default function SwapCustomError({ route }: SwapCustomErrorProps) {
  const { t } = useTranslation();
  const error = route.params.error;

  const titleKey = get(error, "title");
  const rawName = get(error, "name");
  const nameKey = rawName && rawName !== "CompleteExchangeError" ? rawName : undefined;
  const onExport = useExportLogs();
  const headerHeight = useHeaderHeight();

  const messageKey = get(error, "cause.messageKey");

  const { title, description, swapCode } = useMemo(() => {
    const swapCodeValue = get(error, "cause.swapCode") ?? null;
    const errorKey = titleKey || nameKey;

    return (
      resolveMessageKeyCopy(messageKey, t) ??
      resolveErrorKeyCopy(errorKey, t, swapCodeValue) ??
      resolveFallbackCopy(error, t, swapCodeValue)
    );
  }, [error, messageKey, nameKey, t, titleKey]);

  return (
    <SafeAreaView style={[styles.root, { bottom: headerHeight }]}>
      <TrackScreen category="Swap" name="Swap Error Screen" {...sharedSwapTracking} {...error} />
      <Flex justifyContent="center" alignItems="center">
        <Icons.DeleteCircleFill color="red" size="XXL" />
        <Text variant="h3Inter" fontWeight="bold" fontSize={25} textAlign={"center"} mt={24}>
          {title}
        </Text>
        <Text variant="body" textAlign={"center"} testID="error-description-deviceAction" mt={16}>
          {description}

          {swapCode && (
            <Trans i18nKey="errors.CustomError.errorCode" values={{ errorCode: swapCode }} />
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
