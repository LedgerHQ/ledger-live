import React, { useEffect } from "react";
import useFeature from "@ledgerhq/live-config/featureFlags/useFeature";
import { Button, Flex, ScrollListContainer } from "@ledgerhq/native-ui";
import { useTranslation } from "react-i18next";
import { EvmStakingDrawerBody } from "./EvmStakingDrawerBody";
import { Track } from "~/analytics";
import QueuedDrawer from "~/components/QueuedDrawer";
import { useRootDrawerContext } from "~/context/RootDrawerContext";

import { useTheme } from "styled-components/native";
import type { ListProvider } from "./types";

const ascending = (a: ListProvider, b: ListProvider) => (a?.min || 0) - (b?.min || 0);
const descending = (a: ListProvider, b: ListProvider) => (b?.min || 0) - (a?.min || 0);

export function EvmStakingDrawer() {
  const { t } = useTranslation();
  const { isOpen, onModalHide, openDrawer, onClose, drawer } = useRootDrawerContext();
  const ethStakingProviders = useFeature("ethStakingProviders");
  const { theme: themeName } = useTheme();

  useEffect(() => {
    if (
      ethStakingProviders?.enabled ||
      (ethStakingProviders?.params?.listProvider ?? []).length > 0
    ) {
      openDrawer();
    }
  }, [ethStakingProviders, openDrawer]);

  if (!ethStakingProviders || drawer.id !== "EvmStakingDrawer") return null;

  const has32Eth = drawer.props.has32Eth ?? false;

  const listProvidersSorted = ethStakingProviders.params!.listProvider.sort(
    has32Eth ? descending : ascending,
  );

  return (
    <QueuedDrawer isRequestingToBeOpened={isOpen} onClose={onClose} onModalHide={onModalHide}>
      <Flex justifyContent={"center"}>
        <Track onMount event="ETH Stake Modal" />
        <ScrollListContainer
          fadingEdgeLength={36}
          paddingX={4}
          alwaysBounceVertical={false}
          indicatorStyle={themeName === "dark" ? "white" : "default"}
          scrollIndicatorInsets={{ left: 2, bottom: 64 }}
        >
          <EvmStakingDrawerBody
            onClose={onClose}
            singleProviderRedirectMode={drawer.props.singleProviderRedirectMode ?? true}
            accountId={drawer.props.accountId}
            providers={listProvidersSorted}
          />
          <Button onPress={() => onClose()} type="main">
            {t("stake.ethereum.close")}
          </Button>
        </ScrollListContainer>
      </Flex>
    </QueuedDrawer>
  );
}
