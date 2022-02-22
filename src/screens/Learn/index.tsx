import React from "react";
import { SafeAreaView } from "react-native";
import WebView from "react-native-webview";
import styled, { useTheme } from "styled-components/native";
import { useTranslation } from "react-i18next";
import extraStatusBarPadding from "../../logic/extraStatusBarPadding";

const learnURL = "https://www.ledger.com/ledger-live-learn";

const SafeContainer = styled(SafeAreaView)`
  flex: 1;
  background-color: ${p => p.theme.colors.background.main};
  padding-top: ${extraStatusBarPadding}px;
`;

export default function Learn() {
  const { i18n } = useTranslation();
  const {
    colors: { type: themeType },
  } = useTheme();

  const uri = `${learnURL}?theme=${themeType}&lang=${i18n.languages[0]}`;

  return (
    <SafeContainer>
      <WebView source={{ uri }} />
    </SafeContainer>
  );
}
