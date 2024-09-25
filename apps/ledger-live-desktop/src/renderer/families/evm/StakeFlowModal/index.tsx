import { getCryptoCurrencyById } from "@ledgerhq/live-common/currencies/index";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import { Box, Button, Flex, Icons, Text } from "@ledgerhq/react-ui";
import { Account, EthStakingProvider, EthStakingProviderCategory } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import styled, { useTheme } from "styled-components";
import TrackPage from "~/renderer/analytics/TrackPage";
import Modal from "~/renderer/components/Modal";
import EthStakeIllustration from "~/renderer/icons/EthStakeIllustration";
import { openURL } from "~/renderer/linking";
import { EthStakingModalBody } from "./EthStakingModalBody";

const ethMagnitude = getCryptoCurrencyById("ethereum").units[0].magnitude;

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

export const StakeModal = ({ account, hasCheckbox, source }: Props) => {
  const { t } = useTranslation();
  const { colors } = useTheme();

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
          px={3}
          width="100%"
        >
          <Box
            px={3}
            py={4}
            position="sticky"
            style={{
              // TODO proper gradient color
              background: `linear-gradient(to bottom, ${colors.background.main} 75%, transparent 100%)`,
            }}
            top={0}
            width="100%"
          >
            <Flex flexDirection="column" alignItems="center" rowGap={24}>
              <Text ff="Inter|SemiBold" fontSize="24px" lineHeight="32px">
                {t("ethereum.stake.title")}
              </Text>
              <Flex flexDirection="row" alignItems="center" height="24px" columnGap={2}>
                {OPTION_VALUES.map((x, i) => {
                  const checked = i === OPTION_VALUES.indexOf(selected);
                  return (
                    <Button
                      borderRadius={2}
                      height="auto"
                      key={x}
                      onClick={() => setSelected(x)}
                      outline={!checked}
                      size="xs"
                      style={{ textTransform: "capitalize" }}
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
              <Text textAlign="center" color="neutral.c70" fontSize={14} maxWidth={360}>
                {t(`ethereum.stake.category.${selected}.description`)}
              </Text>
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
          </Box>
          <Flex
            backgroundColor={colors.background.main}
            flex={1}
            justifyContent="center"
            overflow="auto"
            paddingX={3}
            width="100%"
          >
            <TrackPage category="ETH Stake Modal" name="Main Modal" />
            <EthStakingModalBody
              onClose={onClose}
              account={account}
              hasCheckbox={hasCheckbox}
              source={source}
              providers={formattedProviders}
            />
          </Flex>
          <Flex
            bottom={0}
            px={3}
            pb={4}
            pt={5}
            position="sticky"
            style={{
              // TODO proper gradient color
              background: `linear-gradient(to top, ${colors.background.main} 70%, transparent 100%)`,
            }}
            width="100%"
          >
            <Flex
              alignItems="center"
              backgroundColor={colors.primary.c20}
              borderRadius={2}
              columnGap={2}
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
          </Flex>
        </Flex>
      )}
    />
  );
};

export default StakeModal;
