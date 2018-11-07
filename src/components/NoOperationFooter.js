/* @flow */
import React from "react";
import { Text } from "react-native";
import { Trans } from "react-i18next";

const el = () => (
  <Text
    style={{
      padding: 60,
      opacity: 0.5,
      textAlign: "center",
    }}
  >
    <Trans i18nKey="common:operationList.noOperations" />
  </Text>
);

export default el;
