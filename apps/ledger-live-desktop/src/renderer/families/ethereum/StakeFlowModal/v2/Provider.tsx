import React, { useCallback } from "react";
import styled from "styled-components";
import { Flex, Text, Tag as TagCore, Link, Icons, Icon } from "@ledgerhq/react-ui";
import { useTranslation } from "react-i18next";
import { Provider as ProviderType } from "./types";
import { useHistory } from "react-router-dom";
import { Account } from "@ledgerhq/types-live";
import { track } from "~/renderer/analytics/segment";
import { getTrackProperties } from "../utils/getTrackProperties";
import { StakingIcon } from "./StakingIcon";
import { openURL } from "~/renderer/linking";

type Props = {
  provider: ProviderType;
  account: Account;
  source?: string;
  onClose?(): void;
};

const Container = styled(Flex)`
  cursor: pointer;
  border-radius: 8px;
  :hover {
    background-color: ${p => p.theme.colors.primary.c10};
  }
`;

const Tag = styled(TagCore)`
  padding: 3px 6px;
  > span {
    font-size: 11px;
    text-transform: none;
    font-weight: bold;
    line-height: 11.66px;
  }
`;

export function Provider({ provider, account, source, onClose }: Props) {
  const { i18n, t } = useTranslation();
  const history = useHistory();

  const tPrefix = `ethereum.stakeV2.${provider.id}`;

  const hasTag = i18n.exists(`${tPrefix}.tag`);

  const onProviderClick = useCallback(() => {
    const providerParams = provider.queryParams ?? {};
    const pathname = `/platform/${provider.liveAppId}`;
    track("button_clicked", {
      button: provider.name,
      ...getTrackProperties({ value: pathname, modal: source }),
    });
    history.push({
      pathname,
      state: {
        accountId: account.id,
        ...providerParams,
      },
    });
    onClose?.();
  }, [provider, history, account, source, onClose]);

  const onInfoLinkClick = useCallback(
    event => {
      if (provider.supportLink) {
        const { liveAppId, supportLink } = provider;
        track("button_clicked", {
          button: `learn_more_${liveAppId}`,
          ...getTrackProperties({ value: provider.supportLink }),
          link: supportLink,
        });
        openURL(
          provider.supportLink,
          "OpenURL",
          getTrackProperties({ value: provider.supportLink }),
        );
      }
      event.stopPropagation();
    },
    [provider],
  );

  return (
    <Container
      pl={3}
      onClick={onProviderClick}
      py={4}
      data-test-id={`stake-provider-container-${provider.id.toLowerCase()}`}
    >
      {!!provider.icon && <StakingIcon icon={provider.icon} />}
      <Flex flexDirection={"column"} ml={5} flex={"auto"} alignItems="flex-start">
        <Flex alignItems="center" mb={1}>
          <Text variant="bodyLineHeight" fontSize={14} fontWeight="semiBold" mr={2}>
            {t(`${tPrefix}.title`)}
          </Text>
          {hasTag && (
            <Tag size="small" active type="plain">
              {t(`${tPrefix}.tag`)}
            </Tag>
          )}
        </Flex>

        <Text variant="paragraph" fontSize={13} color="neutral.c70">
          {t(`${tPrefix}.description`)}
        </Text>
        {provider.supportLink && (
          <Link
            iconPosition="right"
            Icon={Icons.ExternalLinkMedium}
            onClick={onInfoLinkClick}
            type="color"
            color="primary.c80"
            mt={4}
            style={{ fontSize: "14px" }}
          >
            {t(`${tPrefix}.supportLink`)}
          </Link>
        )}
      </Flex>
      <Flex width={40} justifyContent="center" alignItems="center">
        <Icon name="ChevronRight" size={25} />
      </Flex>
    </Container>
  );
}
