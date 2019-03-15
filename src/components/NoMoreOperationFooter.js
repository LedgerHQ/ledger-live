/* @flow */
import React from "react";
import { Text } from "react-native";
import { Trans } from "react-i18next";

const el = () => (
  <Text
    allowFontScaling={false}
    style={{
      padding: 60,
      opacity: 0.5,
      textAlign: "center",
    }}
  >
    <Trans i18nKey="common:operationList.noMoreOperations" />
  </Text>
);

export default el;
