import React from "react";
import styled from "styled-components/native";
import { useTranslation } from "react-i18next";
import ErrorScreen from "./ErrorScreen";
import noConnectionImg from "../../images/noConnection.png";

const NoConnectionIllustration = styled.Image.attrs({ resizeMode: "contain" })`
  tint-color: ${p => p.theme.colors.neutral.c100};
  height: 204px;
  width: 204px;
`;

const NoConnectionErrorScreen = () => {
  const { t } = useTranslation();
  return (
    <ErrorScreen
      Illustration={<NoConnectionIllustration source={noConnectionImg} />}
      title={t("learn.noConnection")}
      description={t("learn.noConnectionDesc")}
    />
  );
};

export default NoConnectionErrorScreen;
