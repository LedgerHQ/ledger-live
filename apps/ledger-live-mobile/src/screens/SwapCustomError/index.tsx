import { Flex, Text } from "@ledgerhq/native-ui";
import React, { useMemo } from "react";
import { StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import { SwapCustomErrorNavigatorParamList } from "~/components/RootNavigator/types/SwapCustomErrorNavigator";
import { ScreenName } from "~/const";
import { Trans, useTranslation } from "react-i18next";
import { Icons } from "@ledgerhq/native-ui";

type SwapCustomErrorPropsProps = StackNavigatorProps<
  SwapCustomErrorNavigatorParamList,
  ScreenName.SwapCustomErrorScreen
>;

export default function SwapCustomError({ route }: SwapCustomErrorPropsProps) {
  const { t } = useTranslation();
  const error = route.params.error;
  const titleKey = error && "title" in error ? error.title : undefined;
  const nameKey =
    error && "name" in error && error.name !== "CompleteExchangeError" ? error.name : undefined;

  const { title, description } = useMemo(() => {
    if (titleKey || nameKey) {
      return {
        title: t(`swapErrors.${titleKey || nameKey}.title`),
        description: t(`swapErrors.${titleKey || nameKey}.description`),
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
    <SafeAreaView style={styles.root}>
      <Flex justifyContent="center" alignItems="center" flex={1}>
        <Icons.Close color="red" size="L" />
        <Text variant="h3Inter" fontWeight="bold" fontSize={25} textAlign={"center"}>
          {title}
        </Text>
        <Text
          variant="body"
          textAlign={"center"}
          testID="error-description-deviceAction"
          mt={"32px"}
        >
          {description}

          {error && "cause" in error && error.cause?.swapCode && (
            <Trans
              i18nKey="errors.CustomError.errorCode"
              values={{ errorCode: error.cause.swapCode }}
            />
          )}
        </Text>
      </Flex>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    padding: 32,
  },
});
