import React from "react";
import { Flex, Icon, Text, Link, Icons } from "@ledgerhq/native-ui";

import { ListProvider } from "./types";

type Props = {
  provider: ListProvider;
};

export function EthereumStakingDrawerProvider(_: Props) {
  return (
    <Flex flexDirection="row" columnGap={16}>
      <Icon name="Group" size={32} />
      <Flex rowGap={12}>
        <Flex rowGap={2}>
          <Text variant="body" fontWeight="semiBold">
            {"Kiln staking pool"}
          </Text>
          <Text variant="paragraph" lineHeight="20px" color="neutral.c70">
            {
              "Join a staking pool. No minimum ETH is required. Rewards are automatically claimed."
            }
          </Text>
        </Flex>
        <Link
          size="medium"
          type="color"
          iconPosition="right"
          Icon={Icons.ExternalLinkMedium}
        >
          {"Learn more about Kiln pooling"}
        </Link>
      </Flex>
    </Flex>
  );
}
