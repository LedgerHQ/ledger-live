import { Flex, Text } from "@ledgerhq/native-ui";
import React from "react";
import { useTranslation } from "react-i18next";

import { ListProvider } from "./types";
import { EthereumStakingDrawerProvider } from "./EthereumStakingDrawerProvider";

type Props = {
  providers: ListProvider[];
};

export function EthereumStakingDrawerBody({ providers }: Props) {
  const { t } = useTranslation();
  return (
    <Flex rowGap={56}>
      <Flex rowGap={16}>
        <Text variant="h4">{t("stake.ethereum.title")}</Text>
        <Text variant="body" lineHeight="21px" color="neutral.c70">
          {t("stake.ethereum.subTitle")}
        </Text>
      </Flex>
      <Flex rowGap={52}>
        {providers.map(provider => (
          <EthereumStakingDrawerProvider
            key={provider.id}
            provider={provider}
          />
        ))}
      </Flex>
    </Flex>
  );
}
