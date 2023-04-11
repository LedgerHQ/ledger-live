import React from "react";
import { Flex, Text } from "@ledgerhq/react-ui";
import { Logo } from "./Logo";
import { PropsRaw } from "./types";
import { useCard } from "./hooks";
import { Container, Subtitle } from "./Layout";
import { useTranslation } from "react-i18next";

export function FullCard(props: PropsRaw) {
  const { t } = useTranslation();
  const { hostname, disabled, onClick } = useCard(props);
  const { manifest } = props;

  return (
    <Container disabled={disabled} onClick={onClick} flex={1}>
      <Flex alignItems="center" marginBottom={3}>
        <Logo icon={manifest.icon} name={manifest.name} size="medium" disabled={disabled} />

        <Flex flex={1} flexDirection="column">
          <Flex>
            <Text flex={1} whiteSpace="nowrap" textOverflow="ellipsis" overflowX="hidden">
              {manifest.name}
            </Text>

            {manifest.branch !== "stable" && (
              <Text
                fontSize={13}
                color="opacityDefault.c50"
                whiteSpace="nowrap"
                borderStyle="solid"
                borderColor="opacityDefault.c10"
                borderRadius={4}
                // Why padding 1 is set to 5px? So odd.
                paddingX={"6px"}
                paddingY={"4px"}
              >
                {t(`platform.catalog.branch.${manifest.branch}`)}
              </Text>
            )}
          </Flex>

          <Subtitle>{hostname}</Subtitle>
        </Flex>
      </Flex>

      <Text fontSize={13} color="opacityDefault.c70">
        {manifest.content.description.en}
      </Text>
    </Container>
  );
}
