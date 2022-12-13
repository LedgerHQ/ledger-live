import React, { memo, useCallback } from "react";
import { useTranslation } from "react-i18next";
import styled, { useTheme } from "styled-components/native";

import { Flex, InfiniteLoader } from "@ledgerhq/native-ui";

import WebViewScreen from "../../components/WebViewScreen";
import { BaseNavigatorStackParamList } from "../../components/RootNavigator/types/BaseNavigator";
import { StackNavigatorProps } from "../../components/RootNavigator/types/helpers";
import { ScreenName } from "../../const/navigation";

export type NavigationProps = StackNavigatorProps<
  BaseNavigatorStackParamList,
  ScreenName.LearnWebView
>;

function LearnWebView({ route }: NavigationProps) {
  const { uri: uriFromRoute } = route.params;
  const { i18n, t } = useTranslation();
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

  return (
    <WebViewScreen
      screenName={t("learn.pageTitle")}
      uri={uri}
      trackEventName="Page Learn"
      renderLoading={renderLoading}
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
