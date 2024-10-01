import { getCryptoCurrencyById } from "@ledgerhq/live-common/currencies/index";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import { Box, Button, Flex, Icons, Text } from "@ledgerhq/react-ui";
import { Account, EthStakingProvider, EthStakingProviderCategory } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import styled, { useTheme } from "styled-components";
import { track } from "~/renderer/analytics/segment";
import TrackPage from "~/renderer/analytics/TrackPage";
import Modal from "~/renderer/components/Modal";
import EthStakeIllustration from "~/renderer/icons/EthStakeIllustration";
import { openURL } from "~/renderer/linking";
import { EthStakingModalBody } from "./EthStakingModalBody";
import * as braze from "@braze/web-sdk";
import { useStore } from "react-redux";
import { trackingEnabledSelector } from "~/renderer/reducers/settings";

const ethMagnitude = getCryptoCurrencyById("ethereum").units[0].magnitude;

const SCROLL_WIDTH = 18;
const SHADOW_HEIGHT = 30;
const BUTTON_CLICKED_TRACK_EVENT = "button_clicked";

const ETH_LIMIT = BigNumber(32).times(BigNumber(10).pow(ethMagnitude));

const IconButton = styled("button")`
  align-items: center;
  background: none;
  border: none;
  color: inherit;
  cursor: pointer;
  display: flex;
  font: inherit;
  justify-content: center;
  outline: inherit;
  padding: 8px;
`;

interface IsScrollable {
  isScrollable: boolean;
}

const ScrollableContainer = styled(Box)<IsScrollable>(
  ({ theme, isScrollable }) => `
  padding: 0px ${isScrollable ? 20 - SCROLL_WIDTH : 20}px 0px 20px;
  flex: 1;
  ${isScrollable ? theme.overflow.y : "overflow: hidden"};


  ::-webkit-scrollbar {
    width: ${SCROLL_WIDTH}px;
  }

  ::-webkit-scrollbar-thumb {
    box-shadow: inset 0 0 0 12px ${theme.colors.neutral.c40};
    border: 6px solid rgba(0,0,0,0);
    border-radius: 12px;
  }
`,
);

const Header = styled(Box)<IsScrollable>(
  ({ isScrollable, theme }) => `
   position: relative;
   ${
     isScrollable
       ? `
        ::after {
            content: "";
            position: absolute;
            top: 100%;
            left: 0;
            right: ${SCROLL_WIDTH}px;
            height: ${SHADOW_HEIGHT}px;
            background: linear-gradient(to bottom, ${theme.colors.background.main}, transparent);
            z-index: 1;
            pointer-events: none;
          }
        `
       : ""
   }
`,
);

const Footer = styled(Box)<IsScrollable>(
  ({ isScrollable, theme }) => `
    position: relative;

    ${
      isScrollable
        ? `
          ::before {
              content: "";
              position: absolute;
              bottom: 100%;
              left: 0;
              right: ${SCROLL_WIDTH}px;
              height: ${SHADOW_HEIGHT}px;
              background: linear-gradient(to top, ${theme.colors.background.main}, transparent);
              z-index: 1;
              pointer-events: none;
            }
        `
        : ""
    }

  `,
);

// Comparison fns for sorting providers by minimum ETH required
const ascending = (a: EthStakingProvider, b: EthStakingProvider) => (a?.min ?? 0) - (b?.min ?? 0);
const descending = (a: EthStakingProvider, b: EthStakingProvider) => (b?.min ?? 0) - (a?.min ?? 0);

type Option = EthStakingProviderCategory | "all";
const OPTION_VALUES: Option[] = ["all", "liquid", "protocol", "pooling", "restaking"] as const;

export interface Props {
  account: Account;
  /** Analytics source */
  source?: string;
  hasCheckbox?: boolean;
}

const MODAL_WIDTH = 500;

export const StakeModal = ({ account, source }: Props) => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const store = useStore();

  const hasMinValidatorEth = account.spendableBalance.isGreaterThan(ETH_LIMIT);

  const ethStakingProviders = useFeature("ethStakingProviders");
  const providers = ethStakingProviders?.params?.listProvider;

  const [selected, setSelected] = useState<Option>("all");

  const formattedProviders = useMemo(
    () =>
      (providers ?? [])
        .filter(x => !x.disabled && (selected === "all" || selected === x.category))
        .sort(hasMinValidatorEth ? descending : ascending),
    [providers, hasMinValidatorEth, selected],
  );

  const scrollableContainerRef = useRef<HTMLDivElement>(null);

  const [isScrollable, setIsScrollable] = useState(false);

  /** When the selected tab changes, we need to check if the content is scrollable */
  useEffect(() => {
    setIsScrollable(
      (scrollableContainerRef.current?.scrollHeight ?? 0) >
        (scrollableContainerRef.current?.clientHeight ?? 0),
    );
  }, [selected, setIsScrollable]);

  useEffect(() => {
    if (!trackingEnabledSelector(store.getState())) {
      return;
    }
    const data = {
      button: `filter_${selected}`,
    };
    track(BUTTON_CLICKED_TRACK_EVENT, data);
    braze.logCustomEvent(BUTTON_CLICKED_TRACK_EVENT, data);
  }, [store, selected]);

  if (!ethStakingProviders?.enabled) {
    return null;
  }

  return (
    <Modal
      name="MODAL_EVM_STAKE"
      centered
      width={MODAL_WIDTH}
      bodyStyle={{
        backgroundColor: colors.background.main,
        height: "100%",
      }}
      render={({ onClose }) => (
        <Flex
          alignItems="center"
          backgroundColor={colors.background.main}
          flex={1}
          flexDirection="column"
          height="100%"
          px={3}
        >
          <Header p={3} pb={0} width="100%" position="relative" isScrollable={isScrollable}>
            <Flex flexDirection="column" alignItems="center">
              <Text ff="Inter|SemiBold" fontSize="24px" lineHeight="32px" mb={4}>
                {t("ethereum.stake.title")}
              </Text>
              <Flex flexDirection="row" alignItems="center" height="24px" columnGap={2} mb={3}>
                {OPTION_VALUES.map((x, i) => {
                  const checked = i === OPTION_VALUES.indexOf(selected);
                  return (
                    <Button
                      borderRadius={2}
                      border={0}
                      height="auto"
                      key={x}
                      onClick={() => setSelected(x)}
                      outline={!checked}
                      size="xs"
                      style={{
                        textTransform: "capitalize",
                        ...(checked ? {} : { backgroundColor: colors.opacityDefault.c10 }),
                      }}
                      variant={checked ? "color" : "main"}
                    >
                      {t(`ethereum.stake.category.${x}.name`)}
                    </Button>
                  );
                })}
              </Flex>
              {formattedProviders.length === 0 && (
                <Flex justifyContent="center" py={20} width="100%">
                  <EthStakeIllustration size={140} />
                </Flex>
              )}
              <Box width="100%" height="100%" display="grid">
                {OPTION_VALUES.map(x => (
                  <Text
                    style={{
                      justifySelf: "center",
                      visibility: x === selected ? "visible" : "hidden",
                      gridArea: "1 / 1 / 2 / 2",
                    }}
                    key={x}
                    textAlign="center"
                    color="neutral.c70"
                    fontSize={14}
                    maxWidth={360}
                  >
                    {t(`ethereum.stake.category.${x}.description`)}
                  </Text>
                ))}
              </Box>
            </Flex>
            <Box
              alignItems="center"
              flexShrink={0}
              justifyContent="center"
              position="absolute"
              right={1}
              top={3}
            >
              <IconButton
                title={t("common.close")}
                data-testid="modal-close-button"
                onClick={onClose}
              >
                <Icons.Close size="M" />
              </IconButton>
            </Box>
          </Header>
          <ScrollableContainer
            ref={scrollableContainerRef}
            backgroundColor={colors.background.main}
            flex={1}
            overflow="auto"
            justifyContent="center"
            paddingX={3}
            paddingY={0}
            isScrollable={isScrollable}
            width="100%"
          >
            <Box height={SHADOW_HEIGHT * 0.8} />
            <TrackPage category="ETH Stake Modal" name="Main Modal" />
            <EthStakingModalBody
              onClose={onClose}
              account={account}
              source={source}
              providers={formattedProviders}
            />
            <Box height={SHADOW_HEIGHT * 0.8} />
          </ScrollableContainer>
          <Footer
            bottom={0}
            px={4}
            pb={3}
            pt={0}
            width="100%"
            position="relative"
            isScrollable={isScrollable}
          >
            <Flex
              alignItems="center"
              backgroundColor={colors.primary.c20}
              borderRadius={2}
              columnGap={3}
              p={2}
              style={{
                cursor: "pointer",
              }}
              width="100%"
              onClick={() =>
                openURL(
                  selected === "restaking"
                    ? "https://www.ledger.com/academy/what-is-ethereum-restaking"
                    : "https://www.ledger.com/academy/ethereum-staking-how-to-stake-eth",
                )
              }
            >
              <Flex flexShrink={0} alignItems="center" justifyContent="center">
                <Flex
                  alignItems="center"
                  backgroundColor={colors.primary.c70a025}
                  borderRadius="50%"
                  justifyContent="center"
                  p={2}
                >
                  <Icons.BookGraduation size="M" color={colors.primary.c80} />
                </Flex>
              </Flex>
              <Box flex={1}>
                <Box>
                  <Text ff="Inter|SemiBold" fontSize={14}>
                    {t("ethereum.stake.how_it_works")}
                  </Text>
                </Box>
                <Box>
                  <Text ff="Inter|SemiBold" fontSize={13} color={colors.palette.text.shade60}>
                    {t("ethereum.stake.read_about")}
                  </Text>
                </Box>
              </Box>
              <Flex flexShrink={0} alignItems="center" justifyContent="center">
                <Icons.ExternalLink size="M" color={colors.palette.text.shade60} />
              </Flex>
            </Flex>
          </Footer>
        </Flex>
      )}
    />
  );
};

export default StakeModal;
