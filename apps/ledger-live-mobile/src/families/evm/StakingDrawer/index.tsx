import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import { Box, ChipTabs, Flex, Icons, ScrollListContainer, Text } from "@ledgerhq/native-ui";
import { EthStakingProvider, EthStakingProviderCategory } from "@ledgerhq/types-live";
import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Linking, TouchableOpacity } from "react-native";
import { useTheme } from "styled-components/native";
import { Track, track } from "~/analytics";
import QueuedDrawer from "~/components/QueuedDrawer";
import { useRootDrawerContext } from "~/context/RootDrawerContext";
import { urls } from "~/utils/urls";
import { EvmStakingDrawerBody } from "./EvmStakingDrawerBody";
import type { ListProvider } from "./types";

type Option = EthStakingProviderCategory | "all";
const OPTION_VALUES: Option[] = ["all", "liquid", "protocol", "pooling", "restaking"] as const;

const INFO_ICON_CONTAINER_SIZE = 40;
const BUTTON_CLICKED_TRACK_EVENT = "button_clicked";

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
  /** @deprecated redirect functionality no longer being considered in latest version of the modal */
  singleProviderRedirectMode: boolean;
}

function Content({ accountId, has32Eth, providers }: Props) {
  const { isOpen, onModalHide, onClose } = useRootDrawerContext();

  const { t } = useTranslation();
  const { theme: themeName, colors } = useTheme();

  const filteredProviders = useMemo(() => (providers ?? []).filter(x => !x.disabled), [providers]);
  const optionValues = useMemo(
    () => OPTION_VALUES.filter(x => x === "all" || filteredProviders.some(y => y.category === x)),
    [filteredProviders],
  );

  const [selectedIndex, setSelectedIndex] = useState(0);
  const selected = optionValues[selectedIndex];

  const OPTION_LABELS = useMemo(
    () => optionValues.map(value => t(`stake.ethereum.category.${value}.name`)),
    [t, optionValues],
  );

  const listProvidersSorted: ListProvider[] = useMemo(
    () =>
      filteredProviders
        .sort(has32Eth ? descending : ascending)
        .filter(x => selected === "all" || selected === x.category),
    [has32Eth, filteredProviders, selected],
  );

  return (
    <QueuedDrawer isRequestingToBeOpened={isOpen} onClose={onClose} onModalHide={onModalHide}>
      <Track onMount event="ETH Stake Modal" />
      <Flex height="100%" rowGap={24}>
        <Flex rowGap={16} alignItems="center">
          <Text variant="h3Inter" textAlign="center" fontWeight="semiBold" fontSize={24}>
            {t("stake.ethereum.title")}
          </Text>
          <ChipTabs
            labels={OPTION_LABELS}
            size="small"
            activeBg={colors.primary.c80}
            activeColor={colors.neutral.c00}
            inactiveColor={colors.neutral.c100}
            gap={8}
            inactiveBg={colors.neutral.c40}
            activeIndex={selectedIndex}
            onChange={index => {
              setSelectedIndex(index);
              track(BUTTON_CLICKED_TRACK_EVENT, {
                button: `filter_${optionValues[index]}`,
              });
            }}
            stretchItems={false}
          />
          <Text variant="body" color="neutral.c80" minHeight={52} textAlign="center">
            {t(`stake.ethereum.category.${selected}.description`)}
          </Text>
        </Flex>
        <ScrollListContainer
          alwaysBounceVertical={false}
          directionalLockEnabled
          flex={1}
          indicatorStyle={themeName === "dark" ? "white" : "default"}
        >
          <EvmStakingDrawerBody
            onClose={onClose}
            accountId={accountId}
            providers={listProvidersSorted}
          />
        </ScrollListContainer>
        <Box backgroundColor={colors.background.drawer} bottom={0} left={0} right={0}>
          <TouchableOpacity
            style={{
              alignItems: "center",
              backgroundColor: colors.primary.c20,
              borderRadius: 8,
              display: "flex",
              flexDirection: "row",
              gap: 16,
              padding: 16,
            }}
            onPress={() =>
              Linking.openURL(
                selected === "restaking"
                  ? urls.ledgerAcademy.whatIsEthereumRestaking
                  : urls.ledgerAcademy.ethereumStakingHowToStakeEth,
              )
            }
          >
            <Flex flexShrink={0} alignItems="center" justifyContent="center">
              <Flex
                alignItems="center"
                backgroundColor="primary.c70a025"
                width={INFO_ICON_CONTAINER_SIZE}
                height={INFO_ICON_CONTAINER_SIZE}
                borderRadius={INFO_ICON_CONTAINER_SIZE / 2}
                justifyContent="center"
                p={2}
              >
                <Icons.BookGraduation size="M" color="primary.c80" />
              </Flex>
            </Flex>
            <Box flex={1} justifyContent="space-between">
              <Text fontSize={14}>{t("stake.ethereum.howItWorks")}</Text>
              <Box>
                <Text fontSize={13} color={colors.neutral.c80}>
                  {t("stake.ethereum.readAbout")}
                </Text>
              </Box>
            </Box>
            <Flex flexShrink={0} alignItems="center" justifyContent="center">
              <Icons.ExternalLink size="S" color={colors.neutral.c80} />
            </Flex>
          </TouchableOpacity>
        </Box>
      </Flex>
    </QueuedDrawer>
  );
}
