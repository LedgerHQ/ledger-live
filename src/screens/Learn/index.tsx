import React, { memo, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useTheme } from "styled-components/native";
import useEnv from "@ledgerhq/live-common/lib/hooks/useEnv";

import WebViewScreen from "../../components/WebViewScreen";
import Loading from "./Loading";

const learnProdURL = "https://www.ledger.com/ledger-live-learn";
const learnStagingURL = "https://www-ppr.ledger.com/ledger-live-learn";

const Learn = () => {
  const { i18n, t } = useTranslation();
  const {
    colors: { type: themeType },
  } = useTheme();
  const useStagingURL = useEnv("USE_LEARN_STAGING_URL");

  const params = new URLSearchParams({
    theme: themeType,
    lang: i18n.languages[0],
  });

  const uri = `${
    useStagingURL ? learnStagingURL : learnProdURL
  }?${params.toString()}`;

  const renderLoading = useCallback(() => <Loading />, []);

  return (
    <WebViewScreen
      screenName={t("learn.pageTitle")}
      uri={uri}
      trackEventName="Page Learn"
      renderLoading={renderLoading}
    />
  );
};

export default memo(Learn);
