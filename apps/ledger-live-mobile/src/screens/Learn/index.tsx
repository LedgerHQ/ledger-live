import React, { memo, useCallback } from "react";
import { useTranslation } from "react-i18next";
import styled, { useTheme } from "styled-components/native";

import { Flex, InfiniteLoader, Text } from "@ledgerhq/native-ui";

import WebViewScreen from "../../components/WebViewScreen";
import { BaseNavigatorStackParamList } from "../../components/RootNavigator/types/BaseNavigator";
import { StackNavigatorProps } from "../../components/RootNavigator/types/helpers";
import HeaderRightClose from "../../components/HeaderRightClose";
import { ScreenName } from "../../const/navigation";
import { useNavigation } from "@react-navigation/native";

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
  } = useTheme();

  const params = new URLSearchParams({
    theme: themeType,
    lang: i18n.languages[0],
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
    navigation.navigate(ScreenName.Learn);
  }, [navigation]);

  return (
    <WebViewScreen
      screenName={t("learn.pageTitle")}
      uri={uri}
      trackEventName="Page Learn"
      renderLoading={renderLoading}
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
          <Flex flex={1}>
            <Text textAlign="center" variant="h5" fontWeight="semiBold">
              {t("help.ledgerAcademy.title")}
            </Text>
          </Flex>
          <Flex width="20%" alignItems="flex-end">
            <HeaderRightClose onClose={goBack} />
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
