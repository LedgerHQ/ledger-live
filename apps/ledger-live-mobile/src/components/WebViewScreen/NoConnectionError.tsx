import React from "react";
import styled from "styled-components/native";
import { useTranslation } from "react-i18next";

import WebViewError from "./Error";
import noConnectionImg from "~/images/noConnection.png";

const NoConnectionIllustration = styled.Image.attrs({ resizeMode: "contain" })`
  tint-color: ${p => p.theme.colors.neutral.c100};
  height: 204px;
  width: 204px;
`;

export type Props = {
  screenName: string;
};

const WebViewNoConnectionError = ({ screenName }: Props) => {
  const { t } = useTranslation();

  return (
    <WebViewError
      screenName={screenName}
      Illustration={<NoConnectionIllustration source={noConnectionImg} />}
      title={t("webview.noConnectionError.title")}
      description={t("webview.noConnectionError.description")}
    />
  );
};

export default WebViewNoConnectionError;
