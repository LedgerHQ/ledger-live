import React from "react";
import { Text } from "@ledgerhq/react-ui/index";
import { Trans } from "react-i18next";

export const Header = () => (
  <Text fontSize="16px" fontWeight="semiBold" color="neutral.c100" padding="16px">
    <Trans i18nKey="nftEntryPoint.title" />
  </Text>
);
