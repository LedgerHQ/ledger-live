import React, { useMemo } from "react";
import { Flex, Text } from "@ledgerhq/react-ui";
import { Logo } from "./Logo";
import { PropsCard } from "./types";
import { useCard } from "./hooks";
import { Container, Subtitle } from "./Layout";
import { useSelector } from "react-redux";
import { languageSelector } from "~/renderer/reducers/settings";
import { RecentlyUsedManifest } from "@ledgerhq/live-common/wallet-api/react";

export function MinimumCard(props: PropsCard<RecentlyUsedManifest>) {
  const { disabled, onClick } = useCard(props);
  const { manifest } = props;

  const lang = useSelector(languageSelector);
  const usedAt = useMemo(() => {
    const rtf = new Intl.RelativeTimeFormat(lang);
    return rtf.format(-manifest.usedAt.diff, manifest.usedAt.unit);
  }, [lang, manifest.usedAt.diff, manifest.usedAt.unit]);

  return (
    <Container disabled={disabled} onClick={onClick} width={300}>
      <Flex alignItems="center">
        <Logo icon={manifest.icon} name={manifest.name} size="small" disabled={disabled} />

        <Flex flex={1} flexDirection="column" overflowY="hidden">
          <Text overflow="hidden" whiteSpace="nowrap" textOverflow="ellipsis" fontSize={14}>
            {manifest.name}
          </Text>
          <Subtitle>{usedAt}</Subtitle>
        </Flex>
      </Flex>
    </Container>
  );
}
