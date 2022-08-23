/* @flow */
import React from "react";
import { Trans } from "react-i18next";
import LText from "./LText";

const el = () => (
  <LText
    style={{
      padding: 60,
      opacity: 0.5,
      textAlign: "center",
    }}
  >
    <Trans i18nKey="common:operationList.noOperations" />
  </LText>
);

export default el;
