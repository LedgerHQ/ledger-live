import React, { useCallback } from "react";
import styled from "styled-components";
import { Flex, ProviderIcon, Text, Tag as TagCore, Link, Icons, Icon } from "@ledgerhq/react-ui";
import { useTranslation } from "react-i18next";
import { Provider as ProviderType } from "./types";
import { useHistory } from "react-router-dom";
import { Account } from "@ledgerhq/types-live";

type Props = {
  provider: ProviderType;
  account: Account;
};

const Container = styled(Flex)`
  cursor: pointer;
  border-radius: 8px;
  :hover {
    background-color: ${p => p.theme.colors.primary.c10};
  }
`;

const Tag = styled(TagCore)`
  padding: 0 5px;
  > span {
    font-size: 14px;
    text-transform: none;
  }
`;

export function Provider({ provider, account }: Props) {
  const { i18n, t } = useTranslation();
  const history = useHistory();

  const tPrefix = `ethereum.stakeV2.${provider.id}`;

  const hasTag = i18n.exists(`${tPrefix}.tag`);

  const onProviderClick = useCallback(() => {
    const providerParams = provider.queryParams ?? {};
    history.push({
      pathname: `/platform/${provider.liveAppId}`,
      state: {
        accountId: account.id,
        ...providerParams,
      },
    });
  }, [provider, history, account]);

  const onInfoLinkClick = useCallback(event => {
    console.log("info link clicked");
    event.stopPropagation();
  }, []);

  return (
    <Container
      pl={3}
      onClick={onProviderClick}
      py={4}
      data-test-id={`stake-provider-container-${provider.name.toLowerCase()}`}
    >
      <ProviderIcon name={provider.name} size="S" boxed={true} />
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
      </Flex>
      <Flex width={40} justifyContent="center" alignItems="center">
        <Icon name="ChevronRight" size={25} />
      </Flex>
    </Container>
  );
}
