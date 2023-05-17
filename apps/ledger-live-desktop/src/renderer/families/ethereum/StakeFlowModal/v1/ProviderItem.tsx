import React, { useCallback } from "react";
import { Flex, Text, Icons, Link, ProviderIcon, Icon, Tag as TagCore } from "@ledgerhq/react-ui";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { Provider } from "./types";

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

type Props = {
  id: string;
  name: string;
  provider: Provider;
  infoOnClick(provider: Provider): void;
  stakeOnClick(provider: Provider): void;
};

const ProviderItem = ({ id, name, provider, infoOnClick, stakeOnClick }: Props) => {
  const { t } = useTranslation();

  const stakeLink = useCallback(() => {
    stakeOnClick(provider);
  }, [provider, stakeOnClick]);

  const infoLink = useCallback(
    event => {
      infoOnClick(provider);
      event.stopPropagation();
    },
    [infoOnClick, provider],
  );

  return (
    <Container
      pl={3}
      onClick={stakeLink}
      py={4}
      data-test-id={`stake-provider-container-${provider.name.toLowerCase()}`}
    >
      <ProviderIcon name={name} size="S" boxed={true} />
      <Flex flexDirection={"column"} ml={5} flex={"auto"} alignItems="flex-start">
        <Flex alignItems="center" mb={1}>
          <Text variant="bodyLineHeight" fontSize={14} fontWeight="semiBold" mr={2}>
            {t("ethereum.stake.providerTitle", { provider: name })}
          </Text>
          <Tag
            size="small"
            active
            type="plain"
            style={{ fontFamily: "14px", textTransform: "none" }}
          >
            {t(`ethereum.stake.${id}.tag`)}
          </Tag>
        </Flex>

        <Text variant="paragraph" fontSize={13} color="neutral.c70">
          {t(`ethereum.stake.${id}.description`, { provider: name })}
        </Text>
        <Link
          iconPosition="right"
          Icon={Icons.ExternalLinkMedium}
          onClick={infoLink}
          type="color"
          color="primary.c80"
          mt={4}
          style={{ fontSize: "14px" }}
        >
          {t("ethereum.stake.providerLink", { provider: name })}
        </Link>
      </Flex>
      <Flex width={40} justifyContent="center" alignItems="center">
        <Icon name="ChevronRight" size={25} />
      </Flex>
    </Container>
  );
};

export default ProviderItem;
