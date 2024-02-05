import { useLocalLiveAppManifest } from "@ledgerhq/live-common/platform/providers/LocalLiveAppProvider/index";
import { useRemoteLiveAppManifest } from "@ledgerhq/live-common/platform/providers/RemoteLiveAppProvider/index";
import { Flex, Icon, Tag as TagCore, Text } from "@ledgerhq/react-ui";
import React, { useCallback, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import styled, { DefaultTheme, StyledComponent } from "styled-components";
import { StakeOnClickProps } from "../EthStakingModalBody";
import { StakingIcon } from "../StakingIcon";
import { ListProvider } from "../types";

export const Container: StyledComponent<
  "div",
  DefaultTheme,
  Record<string, unknown>,
  never
> = styled(Flex)`
  cursor: pointer;
  border-radius: 8px;
  :hover {
    background-color: ${p => p.theme.colors.primary.c10};
  }
`;

export const Tag = styled(TagCore)`
  padding: 3px 6px;
  > span {
    font-size: 11px;
    text-transform: none;
    font-weight: bold;
    line-height: 11.66px;
  }
`;

type Props = {
  provider: ListProvider;
  stakeOnClick(_: StakeOnClickProps): void;
  redirectIfOnlyProvider(_: StakeOnClickProps): void;
};

const ProviderItem = ({ provider, stakeOnClick, redirectIfOnlyProvider }: Props) => {
  const { t, i18n } = useTranslation();

  const localManifest = useLocalLiveAppManifest(provider.liveAppId);
  const remoteManifest = useRemoteLiveAppManifest(provider.liveAppId);

  const manifest = useMemo(() => remoteManifest || localManifest, [localManifest, remoteManifest]);

  const hasTag = i18n.exists(`ethereum.stake.${provider.id}.tag`);

  useEffect(() => {
    if (manifest) redirectIfOnlyProvider({ provider, manifest });
  }, [redirectIfOnlyProvider, provider, manifest]);

  const stakeLink = useCallback(() => {
    if (manifest) stakeOnClick({ provider, manifest });
  }, [provider, stakeOnClick, manifest]);

  return (
    <Container
      pl={3}
      onClick={stakeLink}
      py={4}
      data-test-id={`stake-provider-container-${provider.id}`}
    >
      <StakingIcon icon={provider.icon} />
      <Flex flexDirection={"column"} ml={5} flex={"auto"} alignItems="flex-start">
        <Flex alignItems="center">
          <Text variant="bodyLineHeight" fontSize={14} fontWeight="semiBold" mr={2}>
            {t(`ethereum.stake.${provider.id}.title`)}
          </Text>
          {hasTag && (
            <Tag
              size="small"
              active
              type="plain"
              style={{ fontFamily: "14px", textTransform: "none" }}
            >
              {t(`ethereum.stake.${provider.id}.tag`)}
            </Tag>
          )}
        </Flex>

        <Text variant="paragraph" fontSize={13} color="neutral.c70">
          {t(`ethereum.stake.${provider.id}.description`)}
        </Text>
      </Flex>
      <Flex width={40} justifyContent="center" alignItems="center">
        <Icon name="ChevronRight" size={25} />
      </Flex>
    </Container>
  );
};

export default ProviderItem;
