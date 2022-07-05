import React, { memo, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useTheme } from "styled-components/native";

import useFeature from "@ledgerhq/live-common/featureFlags/useFeature";
import Loading from "./Loading";
import WebViewScreen from "../../components/WebViewScreen";

const DEFAULT_LEARN_URL = "https://www.ledger.com/ledger-live-learn";

function Learn() {
  const { i18n, t } = useTranslation();
  const {
    colors: { type: themeType },
  } = useTheme();
  const learn = useFeature("learn");

  const learnURL = learn?.params?.mobile?.url
    ? learn.params.mobile.url
    : DEFAULT_LEARN_URL;

  const params = new URLSearchParams({
    theme: themeType,
    lang: i18n.languages[0],
  });

  const uri = `${learnURL}?${params.toString()}`;

  const renderLoading = useCallback(() => <Loading />, []);

  return (
    <WebViewScreen
      screenName={t("learn.pageTitle")}
      uri={uri}
      trackEventName="Page Learn"
      renderLoading={renderLoading}
    />
  );
}

export default memo(Learn);
