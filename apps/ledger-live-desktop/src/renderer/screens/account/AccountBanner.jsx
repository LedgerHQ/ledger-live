// @flow

import React from "react";
import { Flex, Alert, Text } from "@ledgerhq/react-ui";
import Button from "~/renderer/components/ButtonV3";
import type { Account } from "@ledgerhq/live-common/types/index";
import { openURL } from "~/renderer/linking";

import { getAccountBannerState as getCosmosBannerState } from "@ledgerhq/live-common/families/cosmos/banner";
import { getAccountBannerProps as getCosmosBannerProps } from "~/renderer/families/cosmos/utils";

import { getAccountBannerState as getEthereumBannerState } from "@ledgerhq/live-common/families/ethereum/banner";
import { getAccountBannerProps as getEthereumBannerProps } from "~/renderer/families/ethereum/utils";

const getBannerProps = (account: Account, hooks) => {
  switch (account.currency.family) {
    case "cosmos": {
      const state = getCosmosBannerState(account);
      const props = getCosmosBannerProps(state, account, hooks);
      return props;
    }
    case "ethereum": {
      const state = getEthereumBannerState(account);
      const props = getEthereumBannerProps(state, account, hooks);
      return props;
    }
    default: {
      return { display: false };
    }
  }
};

// optional prop in flow
type BannerProps = {
  title: string,
  linkText?: string,
  linkUrl?: string,
  description: string,
  cta: string,
  onClick: () => void,
};

const AccountBanner = ({ title, description, cta, onClick, linkUrl, linkText }: BannerProps) => {
  return (
    <Alert
      type="info"
      showIcon={false}
      containerProps={{ mt: -4, mb: 4, mx: 0, p: 12 }}
      renderContent={() => (
        <Flex style={{ alignItems: "center", width: "100%" }}>
          <Flex style={{ flex: 1, flexDirection: "column" }}>
            <Text color="inherit" variant="body" fontWeight="bold" fontSize="14px">
              {title}
            </Text>
            <Text color="inherit" variant="body" fontSize="14px" style={{ marginTop: "10px" }}>
              {description}{" "}
              {linkUrl && linkText && (
                <Text
                  color="inherit"
                  variant="body"
                  fontSize="14px"
                  style={{ marginTop: "10px", textDecoration: "underline", cursor: "pointer" }}
                  onClick={() => openURL(linkUrl)}
                >{`${linkText}`}</Text>
              )}
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
