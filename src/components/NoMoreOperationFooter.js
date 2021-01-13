/* @flow */
import React from "react";
import { Trans } from "react-i18next";
import LText from "./LText";

const el = () => (
  <LText
    allowFontScaling={false}
    style={{
      padding: 60,
      opacity: 0.5,
      textAlign: "center",
    }}
  >
    <Trans i18nKey="common:operationList.noMoreOperations" />
  </LText>
);

export default el;
