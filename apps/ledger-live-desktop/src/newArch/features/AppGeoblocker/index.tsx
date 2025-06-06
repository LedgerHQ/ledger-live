import React from "react";
import { Box, Flex, Icons, Link, Text } from "@ledgerhq/react-ui";
import { Trans } from "react-i18next";
import styled from "styled-components";
import { useOFACGeoBlockCheck } from "@ledgerhq/live-common/hooks/useOFACGeoBlockCheck";
import { urls } from "~/config/urls";
import { openURL } from "~/renderer/linking";
import { useLocalizedUrl } from "~/renderer/hooks/useLocalizedUrls";

const Container = styled(Box)`
  background-color: ${p => p.theme.colors.opacityDefault.c05};
  border-radius: 100%;
  height: 72px;
  width: 72px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const GradientDiv = styled(Flex)`
  background: radial-gradient(
    at top center,
    ${p => p.theme.colors.error.c10} 0%,
    ${p => p.theme.colors.background.main} 30%
  );
`;

export function AppGeoBlocker({ children }: { children: React.ReactNode }) {
  const { blocked } = useOFACGeoBlockCheck({
    onFinish: () => window.api?.appLoaded(),
    geoBlockingFeatureFlagKey: "lldOfacGeoBlocking",
  });

  const localizedLearnMoreUrl = useLocalizedUrl(urls.geoBlock.learnMore);

  const openUrl = () => openURL(localizedLearnMoreUrl);

  if (blocked)
    return (
      <GradientDiv flexDirection="column" alignItems="center" justifyContent="center" height="100%">
        <Container>
          <Icons.DeleteCircleFill size="L" color="error.c60" data-testID="delete-icon" />
        </Container>
        <Text variant="bodyLineHeight" color="neutral.c100" fontSize={24} marginTop={24}>
          <Trans i18nKey="geoBlocking.title" />
        </Text>
        <Text variant="body" fontSize={14} color="neutral.c70" marginTop={16}>
          <Trans i18nKey="geoBlocking.description" />
        </Text>
        <Link
          size="medium"
          color="neutral.c100"
          Icon={() => <Icons.ExternalLink size="S" />}
          onClick={openUrl}
          padding={3}
          marginTop={24}
          border={1}
          borderStyle="solid"
          borderColor="opacity.c30"
          borderRadius={500}
          style={{ textDecoration: "none" }}
        >
          <Trans i18nKey="geoBlocking.learnMore" />
        </Link>
      </GradientDiv>
    );

  return children;
}
