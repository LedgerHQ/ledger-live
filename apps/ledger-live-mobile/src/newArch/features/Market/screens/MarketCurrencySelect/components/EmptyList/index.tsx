import { Flex, Text } from "@ledgerhq/native-ui";
import React from "react";
import { Trans } from "react-i18next";
import { Image } from "react-native";
import { useTheme } from "styled-components/native";

interface EmptyListProps {
  search: string;
}

function EmptyList({ search }: EmptyListProps) {
  const { colors } = useTheme();
  return (
    <Flex alignItems="center">
      <Image
        style={{ width: 164, height: 164 }}
        source={
          colors.palette.type === "light"
            ? require("~/images/marketNoResultslight.png")
            : require("~/images/marketNoResultsdark.png")
        }
      />
      <Text textAlign="center" variant="h4" my={3}>
        <Trans i18nKey="market.warnings.noCurrencyFound" />
      </Text>
      <Text textAlign="center" variant="body" color="neutral.c70">
        <Trans i18nKey="market.warnings.noCurrencySearchResultsFor" values={{ search }}>
          <Text fontWeight="bold" variant="body" color="neutral.c70">
            {""}
          </Text>
        </Trans>
      </Text>
    </Flex>
  );
}

export default EmptyList;
