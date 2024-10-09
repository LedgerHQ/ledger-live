import { useRemoteLiveAppManifest } from "@ledgerhq/live-common/platform/providers/RemoteLiveAppProvider/index";
import { useLocalLiveAppManifest } from "@ledgerhq/live-common/wallet-api/LocalLiveAppProvider/index";
import { CryptoIcon, Flex, Icon, Text } from "@ledgerhq/react-ui";
import { EthStakingProvider } from "@ledgerhq/types-live";
import React, { useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import styled, { DefaultTheme, StyledComponent } from "styled-components";
import ProviderIcon from "~/renderer/components/ProviderIcon";
import { StakeOnClickProps } from "../EthStakingModalBody";

const IconContainer = styled.div(
  ({ theme }) => `
  display: flex;
  justify-content: center;
  align-items: center;
  width: ${theme.space[6]}px;
  height: ${theme.space[6]}px;
  border-radius: 100%;
  background-color: ${theme.colors.opacityDefault.c05};
  margin-top: ${theme.space[3]}px;
`,
);

function StakingIcon({ icon }: { icon?: string }) {
  if (!icon) {
    return null;
  }

  const [iconName, iconType] = icon.split(":");

  // if no icon type then treat as "normal" icon.
  if (!iconType) {
    return (
      <IconContainer>
        <Icon name={iconName} size={14} />
      </IconContainer>
    );
  }
  if (iconType === "crypto") {
    return <CryptoIcon name={iconName} size={40} />;
  }
  if (iconType === "provider") {
    return (
      <Flex>
        <ProviderIcon name={iconName} size="M" />
      </Flex>
    );
  }

  return null;
}

const Container: StyledComponent<"div", DefaultTheme, Record<string, unknown>, never> = styled(
  Flex,
)`
  cursor: pointer;
  background-color: ${p => p.theme.colors.opacityDefault.c05};
  :hover {
    background-color: ${p => p.theme.colors.primary.c10};
  }
`;

interface Props {
  provider: EthStakingProvider;
  stakeOnClick(_: StakeOnClickProps): void;
}

export const ProviderItem = ({ provider, stakeOnClick }: Props) => {
  const { t } = useTranslation();

  const localManifest = useLocalLiveAppManifest(provider.liveAppId);
  const remoteManifest = useRemoteLiveAppManifest(provider.liveAppId);

  const manifest = useMemo(() => remoteManifest || localManifest, [localManifest, remoteManifest]);

  const handleClick = useCallback(() => {
    if (manifest) {
      stakeOnClick({ provider, manifest });
    }
  }, [provider, stakeOnClick, manifest]);

  return (
    <Container
      alignItems="center"
      borderRadius={2}
      columnGap={4}
      data-testid={`stake-provider-container-${provider.id}`}
      onClick={handleClick}
      p={3}
    >
      <StakingIcon icon={provider.icon} />
      <Flex alignItems="flex-start" flex={2} flexDirection="column">
        <Text variant="bodyLineHeight" fontSize={14} fontWeight="semiBold" mr={2}>
          {t(`ethereum.stake.provider.${provider.id}.title`)}
        </Text>
        <Text variant="paragraph" fontSize={13} color="neutral.c70">
          {provider.lst
            ? t("ethereum.stake.lst")
            : provider.min
              ? t("ethereum.stake.requiredMinimum", {
                  min: provider.min,
                })
              : t("ethereum.stake.noMinimum")}
        </Text>
      </Flex>
      <Flex flex={1} flexWrap="wrap" justifyContent="right">
        <Text variant="paragraph" fontSize={13} color="neutral.c70" textAlign="right">
          {t(`ethereum.stake.rewardsStrategy.${provider.rewardsStrategy}`)}
        </Text>
      </Flex>
    </Container>
  );
};
