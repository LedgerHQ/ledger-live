// @flow

import React from "react";
import { Flex, Alert, Text } from "@ledgerhq/react-ui";
import Button from "~/renderer/components/ButtonV3";
import type { Account } from "@ledgerhq/live-common/types/index";

import { getAccountBannerState as getCosmosBannerState } from "@ledgerhq/live-common/families/cosmos/banner";
import { getAccountBannerProps as getCosmosBannerProps } from "~/renderer/families/cosmos/utils";

const getBannerProps = (account: Account, hooks) => {
  const id = account.currency.id;
  switch (id) {
    case "cosmos":
      const state = getCosmosBannerState(account);
      const props = getCosmosBannerProps(state, account, hooks);
      return props;

    default:
      return { display: false };
  }
};

type BannerProps = {
  title: string,
  description: string,
  cta: string,
  onClick: () => void,
};

const AccountBanner = ({ title, description, cta, onClick }: BannerProps) => {
  return (
    <Alert
      type="info"
      showIcon={false}
      containerProps={{ mt: -4, mb: 4, mx: 0, p: 12 }}
      renderContent={({ color, textProps }) => (
        <Flex style={{ alignItems: "center", width: "100%" }}>
          <Flex style={{ flex: 1, flexDirection: "column" }}>
            <Text color="inherit" variant="body" fontWeight="bold" fontSize="14px">
              {title}
            </Text>
            <Text color="inherit" variant="body" fontSize="14px" style={{ marginTop: "10px" }}>
              {description}
            </Text>
          </Flex>
          <Button variant="color" ml={12} onClick={onClick}>
            {cta}
          </Button>
        </Flex>
      )}
    />
  );
};

export { getBannerProps, AccountBanner };
