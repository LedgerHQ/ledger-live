import React from "react";
import { SafeAreaView } from "react-native";
import WebView from "react-native-webview";
import styled, { useTheme } from "styled-components/native";
import { useTranslation } from "react-i18next";
import useEnv from "@ledgerhq/live-common/lib/hooks/useEnv";
import extraStatusBarPadding from "../../logic/extraStatusBarPadding";

const learnProdURL = "https://www.ledger.com/ledger-live-learn";
const learnStagingURL =
  "https://ecommerce-website.aws.stg.ldg-tech.com/ledger-live-learn";

const SafeContainer = styled(SafeAreaView)`
  flex: 1;
  background-color: ${p => p.theme.colors.background.main};
  padding-top: ${extraStatusBarPadding}px;
`;

const StyledWebview = styled(WebView)`
  background-color: transparent; // avoids white background before page loads
`;

export default function Learn() {
  const { i18n } = useTranslation();
  const {
    colors: { type: themeType },
  } = useTheme();

  const useStagingURL = useEnv("USE_LEARN_STAGING_URL");

  const uri = `${
    useStagingURL ? learnStagingURL : learnProdURL
  }?theme=${themeType}&lang=${i18n.languages[0]}`;

  return (
    <SafeContainer>
      <StyledWebview source={{ uri }} />
    </SafeContainer>
  );
}
