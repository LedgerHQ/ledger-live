import React from "react";
import { Flex } from "@ledgerhq/native-ui";
import WebView from "react-native-webview";
import { useTheme } from "styled-components/native";
import { useTranslation } from "react-i18next";

export default function Learn() {
  const { i18n } = useTranslation();
  const {
    colors: { type: themeType },
  } = useTheme();
  return (
    <Flex flex={1}>
      <WebView
        backgroundColor="transparent"
        source={{
          uri: `https://media-ledgerlive.ledger-ppr.com?theme=${themeType}&lang=${i18n.languages[0]}`,
        }}
      />
    </Flex>
  );
}
