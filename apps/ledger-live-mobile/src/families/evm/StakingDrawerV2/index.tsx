import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import { ChipTabs, Flex, ScrollListContainer, Text } from "@ledgerhq/native-ui";
import { EthStakingProvider, EthStakingProviderCategory } from "@ledgerhq/types-live";
import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useTheme } from "styled-components/native";
import { Track } from "~/analytics";
import QueuedDrawer from "~/components/QueuedDrawer";
import { useRootDrawerContext } from "~/context/RootDrawerContext";
import { EvmStakingDrawerBody } from "./EvmStakingDrawerBody";
import type { ListProvider } from "./types";

type Option = EthStakingProviderCategory | "all";
const OPTION_VALUES: Option[] = ["all", "liquid", "protocol", "pooling", "restaking"] as const;

// compare functions for sorting providers list based on minimum required stake
const ascending = (a: ListProvider, b: ListProvider) => (a?.min || 0) - (b?.min || 0);
const descending = (a: ListProvider, b: ListProvider) => (b?.min || 0) - (a?.min || 0);

export function EvmStakingDrawer() {
  const { openDrawer, drawer } = useRootDrawerContext();
  const ethStakingProviders = useFeature("ethStakingProviders");
  const isStakingProvidersEnabled = ethStakingProviders?.enabled;
  const providers: ListProvider[] | undefined = ethStakingProviders?.params?.listProvider;

  useEffect(() => {
    if (isStakingProvidersEnabled || (providers ?? []).length > 0) {
      openDrawer();
    }
  }, [isStakingProvidersEnabled, openDrawer, providers]);

  return !ethStakingProviders || drawer.id !== "EvmStakingDrawer" ? null : (
    <Content
      accountId={drawer.props.accountId}
      has32Eth={drawer.props.has32Eth ?? false}
      providers={ethStakingProviders?.params?.listProvider ?? []}
      singleProviderRedirectMode={drawer.props.singleProviderRedirectMode ?? true}
    />
  );
}

interface Props {
  accountId: string;
  has32Eth: boolean;
  providers: EthStakingProvider[];
  singleProviderRedirectMode: boolean;
}

function Content({ accountId, has32Eth, providers, singleProviderRedirectMode }: Props) {
  const { isOpen, onModalHide, onClose } = useRootDrawerContext();

  const { t } = useTranslation();

  const { theme: themeName } = useTheme();

  const [selectedIndex, setSelectedIndex] = useState(0);
  const selected = OPTION_VALUES[selectedIndex];

  const OPTION_LABELS = useMemo(
    () => OPTION_VALUES.map(value => t(`stake.ethereum_v2.category.${value}.name`)),
    [t],
  );

  const listProvidersSorted: ListProvider[] = useMemo(
    () =>
      providers
        .sort(has32Eth ? descending : ascending)
        .filter(x => !x.disabled && (selected === "all" || selected === x.category)),
    [has32Eth, providers, selected],
  );

  return (
    <QueuedDrawer isRequestingToBeOpened={isOpen} onClose={onClose} onModalHide={onModalHide}>
      <Flex height="90%" rowGap={24}>
        <Track onMount event="ETH Stake Modal" />
        <Flex
          rowGap={24}
          alignItems="center"
          position="sticky"
          flexGrow={0}
          flexShrink={0}
          top={0}
          // TODO use react-native-linear gradient
          // style={{
          //   background: `linear-gradient(to bottom, background.main 75%, transparent 100%)`,
          // }}
        >
          <Text variant="h4" textAlign="center">
            {t("stake.ethereum_v2.title")}
          </Text>
          <ChipTabs
            labels={OPTION_LABELS}
            size="small"
            activeIndex={selectedIndex}
            onChange={setSelectedIndex}
          />
          <Text
            variant="body"
            lineHeight="21px"
            color="neutral.c70"
            textTransform="capitalize"
            textAlign="center"
          >
            {t(`stake.ethereum_v2.category.${selected}.description`)}
          </Text>
        </Flex>
        <Flex flex={1}>
          <ScrollListContainer
            directionalLockEnabled
            paddingX={4}
            alwaysBounceVertical={false}
            indicatorStyle={themeName === "dark" ? "white" : "default"}
          >
            <EvmStakingDrawerBody
              onClose={onClose}
              singleProviderRedirectMode={singleProviderRedirectMode}
              accountId={accountId}
              providers={listProvidersSorted}
            />
          </ScrollListContainer>
        </Flex>
        {/* <Flex p={16} position="sticky" bottom={0}>
          <Text variant="h4" textAlign="center">
            {t("stake.ethereum_v2.title")}
          </Text>
        </Flex> */}
      </Flex>
    </QueuedDrawer>
  );
}
