import React, { useMemo } from "react";
import { Flex, Text } from "@ledgerhq/react-ui";
import { Logo } from "./Logo";
import { PropsCard } from "./types";
import { useCard } from "./hooks";
import { Container, Subtitle } from "./Layout";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import { languageSelector } from "~/renderer/reducers/settings";
import styled, { useTheme } from "styled-components";
import { Cta } from "./Cta";
import { translateContent } from "@ledgerhq/live-common/wallet-api/logic";
import { LiveAppManifest } from "@ledgerhq/live-common/platform/types";

export const Highlight = styled(Container).attrs({})`
  background: linear-gradient(${p => p.theme.colors.palette.background.default}, rgba(0, 0, 0, 0));
`;

export function FullCard(props: PropsCard<LiveAppManifest>) {
  const language = useSelector(languageSelector);
  const { t } = useTranslation();
  const theme = useTheme();
  const { hostname, disabled, onClick } = useCard(props);

  const { manifest } = props;
  const highlighted = !!manifest.highlight;
  const textColor = highlighted ? "white" : theme.colors.palette.text.shade100;

  const subtitle = useMemo(
    () =>
      manifest.content.subtitle ? translateContent(manifest.content.subtitle, language) : undefined,
    [language, manifest.content.subtitle],
  );
  const cta = useMemo(
    () => (manifest.content.cta ? translateContent(manifest.content.cta, language) : undefined),
    [language, manifest.content.cta],
  );

  return (
    <Container
      data-test-id={`platform-catalog-app-${manifest.id}`}
      highlighted={highlighted}
      disabled={disabled}
      onClick={onClick}
      flex={1}
    >
      <Flex alignItems="center">
        <Logo icon={manifest.icon} name={manifest.name} size="medium" disabled={disabled} />

        <Flex flex={1} flexDirection="column">
          <Flex>
            <Text
              color={textColor}
              flex={1}
              whiteSpace="nowrap"
              textOverflow="ellipsis"
              overflowX="hidden"
            >
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
          <Subtitle>{subtitle || hostname}</Subtitle>
        </Flex>
      </Flex>
      <Flex
        flexDirection={"column"}
        rowGap={20}
        justifyContent={"space-between"}
        columnGap={20}
        mt={20}
        mb={0}
      >
        <Flex flex={3} minWidth={100}>
          <Text fontSize={13} flex={3} color={highlighted ? "white" : "opacityDefault.c70"}>
            {manifest.content.shortDescription[language] ?? manifest.content.shortDescription.en}
          </Text>
        </Flex>
        {cta && <Cta text={cta} />}
      </Flex>
    </Container>
  );
}
