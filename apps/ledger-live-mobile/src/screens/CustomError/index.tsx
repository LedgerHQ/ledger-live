import { Flex, Text } from "@ledgerhq/native-ui";
import React from "react";
import { StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import { CustomErrorNavigatorParamList } from "~/components/RootNavigator/types/CustomErrorNavigator";
import { ScreenName } from "~/const";
import { Trans, useTranslation } from "react-i18next";
import { Icons } from "@ledgerhq/native-ui";

type CustomErrorPropsProps = StackNavigatorProps<
  CustomErrorNavigatorParamList,
  ScreenName.CustomErrorScreen
>;

export default function CustomError({ route }: CustomErrorPropsProps) {
  const { t } = useTranslation();
  const error = route.params.error;

  return (
    <SafeAreaView style={styles.root}>
      <Flex justifyContent="center" alignItems="center" flex={1}>
        <Icons.Close color="red" size="L" />
        <Text variant="h3Inter" fontWeight="bold" fontSize={25} textAlign={"center"}>
          {t("errors.CustomError.title")}
          {"\n"}
        </Text>
        <Text variant="body" textAlign={"center"}>
          {t("errors.CustomError.description")}

          {error && "cause" in error && error.cause?.swapCode && (
            <Trans
              i18nKey="errors.CustomError.errorCode"
              values={{ errorCode: error.cause.swapCode }}
            />
          )}

          {error && "message" in error && error.message && (
            <Trans
              i18nKey="errors.CustomError.errorMessage"
              values={{ errorMessage: error.message }}
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
