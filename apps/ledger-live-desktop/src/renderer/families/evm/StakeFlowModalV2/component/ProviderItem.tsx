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

const ProviderIconContainer = styled.div(
  () => `
  display: flex;
`,
);

export function StakingIcon({ icon }: { icon?: string }) {
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
      <ProviderIconContainer>
        <ProviderIcon name={iconName} size="L" />
      </ProviderIconContainer>
    );
  }

  return null;
}

export const Container: StyledComponent<
  "div",
  DefaultTheme,
  Record<string, unknown>,
  never
> = styled(Flex)`
  cursor: pointer;
  background-color: ${p => p.theme.colors.opacityDefault.c05};
  :hover {
    background-color: ${p => p.theme.colors.primary.c10};
  }
`;

type Props = {
  provider: EthStakingProvider;
  stakeOnClick(_: StakeOnClickProps): void;
};

const ProviderItem = ({ provider, stakeOnClick }: Props) => {
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
      p={2}
      borderRadius={2}
      onClick={handleClick}
      alignItems="center"
      columnGap={2}
      data-testid={`stake-provider-container-${provider.id}`}
    >
      <StakingIcon icon={provider.icon} />
      <Flex alignItems="flex-start" flex={2} flexDirection="column">
        <Text variant="bodyLineHeight" fontSize={14} fontWeight="semiBold" mr={2}>
          {t(`ethereum.stake_v2.provider.${provider.id}.title`)}
        </Text>
        <Text variant="paragraph" fontSize={13} color="neutral.c70">
          {provider.lst
            ? t("ethereum.stake_v2.lst")
            : provider.min
              ? t("ethereum.stake_v2.required_minimum", {
                  min: provider.min,
                })
              : t("ethereum.stake_v2.no_minimum")}
        </Text>
      </Flex>
      <Flex flex={1} flexWrap="wrap" justifyContent="right">
        <Text variant="paragraph" fontSize={13} color="neutral.c70" textAlign="right">
          {t(`ethereum.stake_v2.rewards_strategy.${provider.rewardsStrategy}`)}
        </Text>
      </Flex>
    </Container>
  );
};

export default ProviderItem;
