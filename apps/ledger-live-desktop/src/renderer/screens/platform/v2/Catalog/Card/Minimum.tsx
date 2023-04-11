import React from "react";
import { Flex, Text } from "@ledgerhq/react-ui";
import { Logo } from "./Logo";
import { PropsRaw } from "./types";
import { useCard } from "./hooks";
import { Container, Subtitle } from "./Layout";

export function MinimumCard(props: PropsRaw) {
  const { disabled, onClick } = useCard(props);
  const { manifest } = props;

  return (
    <Container disabled={disabled} onClick={onClick} width={300}>
      <Flex alignItems="center">
        <Logo icon={manifest.icon} name={manifest.name} size="small" disabled={disabled} />

        <Flex flex={1} flexDirection="column" overflowY="hidden">
          <Text overflow="hidden" whiteSpace="nowrap" textOverflow="ellipsis" fontSize={14}>
            {manifest.name}
          </Text>

          <Subtitle>{manifest.usedAt}</Subtitle>
        </Flex>
      </Flex>
    </Container>
  );
}
