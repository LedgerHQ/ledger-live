import { Button, Flex, Text } from "@ledgerhq/native-ui";
import React from "react";

import { ListProvider } from "./types";
import { EthereumStakingDrawerProvider } from "./EthereumStakingDrawerProvider";

type Props = {
  providers: ListProvider[];
};

export function EthereumStakingDrawerBody({ providers }: Props) {
  return (
    <Flex rowGap={59}>
      <Flex rowGap={56}>
        <Flex rowGap={16}>
          <Text variant="h4">{"Grow your ETH holdings"}</Text>
          <Text variant="body" lineHeight="21px" color="neutral.c70">
            {
              "Stake your ETH and grow your holdings by earning daily rewards directly into your Ledger Live."
            }
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
      <Button type="main">{"Close"}</Button>
    </Flex>
  );
}
