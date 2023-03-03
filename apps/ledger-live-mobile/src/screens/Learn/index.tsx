import React, { memo, useCallback } from "react";
import { TouchableOpacity } from "react-native";
import { useTranslation } from "react-i18next";
import styled, { useTheme } from "styled-components/native";

import { Flex, InfiniteLoader, Text, Icons } from "@ledgerhq/native-ui";

import { useNavigation } from "@react-navigation/native";
import WebViewScreen from "../../components/WebViewScreen";
import { BaseNavigatorStackParamList } from "../../components/RootNavigator/types/BaseNavigator";
import { StackNavigatorProps } from "../../components/RootNavigator/types/helpers";
import { NavigatorName, ScreenName } from "../../const/navigation";

export type NavigationProps = StackNavigatorProps<
  BaseNavigatorStackParamList,
  ScreenName.LearnWebView
>;

function LearnWebView({ route }: NavigationProps) {
  const { uri: uriFromRoute } = route.params;
  const { i18n, t } = useTranslation();
  const navigation = useNavigation();
  const {
    colors: { type: themeType },
    space,
  } = useTheme();

  const params = new URLSearchParams({
    theme: themeType,
    lang: i18n.languages[0],
    apptracking: "false",
  });

  const uri = `${uriFromRoute}?${params.toString()}`;

  const renderLoading = useCallback(
    () => (
      <Container>
        <InfiniteLoader />
      </Container>
    ),
    [],
  );

  const goBack = useCallback(() => {
    navigation.navigate(NavigatorName.ExploreTab, {
      screen: ScreenName.Learn,
    });
  }, [navigation]);

  return (
    <WebViewScreen
      screenName={t("learn.pageTitle")}
      uri={uri}
      trackEventName="Page Learn"
      renderLoading={renderLoading}
      enableNavigationOverride={false}
      renderHeader={() => (
        <Flex
          flexDirection="row"
          justifyContent="space-between"
          alignItems="center"
          width="100%"
          height={48}
          zIndex={1}
        >
          <Flex width="20%" />
          <Flex
            width="60%"
            alignItems="center"
            justifyContent="center"
            flexDirection="row"
          >
            <Icons.LockMedium size={16} color="neutral.c70" />
            <Text
              textAlign="center"
              variant="small"
              fontWeight="medium"
              color="neutral.c70"
              ml={2}
            >
              ledger.com/academy
            </Text>
          </Flex>
          <Flex width="20%" alignItems="flex-end">
            <TouchableOpacity onPress={goBack} style={{ padding: space[6] }}>
              <Text variant="body" fontWeight="semiBold">
                {t("common.close")}
              </Text>
            </TouchableOpacity>
          </Flex>
        </Flex>
      )}
    />
  );
}

const Container = styled(Flex)`
  width: 100%;
  height: 100%;
  flex-direction: column;
  align-items: center;
  justify-content: center;
`;

export default memo(LearnWebView);
