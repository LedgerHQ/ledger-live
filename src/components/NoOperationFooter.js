/* @flow */
import React from "react";
import { Text } from "react-native";
import { translate } from "react-i18next";

import type { T } from "../types/common";

const el = ({ t }: { t: T }) => (
  <Text
    style={{
      padding: 60,
      opacity: 0.5,
      textAlign: "center",
    }}
  >
    {t("common.operationList.noOperations")}
  </Text>
);

export default translate()(el);
