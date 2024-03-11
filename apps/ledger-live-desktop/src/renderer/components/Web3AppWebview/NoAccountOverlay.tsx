import React from "react";
import { Button, Flex, Text } from "@ledgerhq/react-ui";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { useSelectAccount } from "./helpers";
import { LiveAppManifest } from "@ledgerhq/live-common/platform/types";
import { CurrentAccountHistDB } from "@ledgerhq/live-common/wallet-api/react";

const Overlay = styled.div`
  display: flex;
  height: 100vh;
  align-items: center;
  justify-content: center;
  user-select: none;

  &.overlay-enter {
    opacity: 1;
  }
  &.overlay-enter-active {
    opacity: 0;
    transition: opacity 300ms;
  }
  &.overlay-enter-done {
    display: none;
    opacity: 0;
  }
  &.overlay-exit {
    opacity: 0;
  }
  &.overlay-exit-active {
    opacity: 1;
    transition: opacity 200ms;
  }
  &.overlay-exit-done {
    opacity: 1;
  }
`;

export const NoAccountOverlay = ({
  manifest,
  currentAccountHistDb,
}: {
  manifest: LiveAppManifest;
  currentAccountHistDb?: CurrentAccountHistDB;
}) => {
  const { t } = useTranslation();
  const { onSelectAccount } = useSelectAccount({ manifest, currentAccountHistDb });
  return (
    <Overlay>
      <Flex flexDirection="column" alignItems="center">
        <Text mb={6} color="neutral.c100">
          {t("webview.noAccounts.title")}
        </Text>
        <Button onClick={onSelectAccount} variant="main">
          {t("webview.noAccounts.add")}
        </Button>
      </Flex>
    </Overlay>
  );
};
