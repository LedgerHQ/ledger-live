import React from "react";
import { Flex, Text } from "@ledgerhq/native-ui";
import { Image } from "react-native";
import { useTranslation } from "react-i18next";

import graphPlaceholderSource from "../../../assets/images/graph/graphPlaceholder.png";

export const GraphPlaceholder = () => {
  const { t } = useTranslation();

  return (
    <Flex>
      <Flex
        style={{
          padding: 5,
        }}
      >
        <Text
          numberOfLines={1}
          color="neutral.c80"
          fontWeight="semiBold"
          variant="subtitle"
          uppercase
          textAlign="center"
        >
          {t("graph.graphNotSupported")}
        </Text>
      </Flex>
      <Image
        source={graphPlaceholderSource}
        resizeMode={"contain"}
        style={{ width: "100%", height: 120 }}
      />
    </Flex>
  );
};
