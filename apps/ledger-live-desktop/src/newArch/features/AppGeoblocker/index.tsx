import { Box, Flex, Icons, Link, Text } from "@ledgerhq/react-ui";
import React, { useEffect, useState } from "react";
import { Trans } from "react-i18next";
import styled from "styled-components";
import { useQuery } from "@tanstack/react-query";

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

export function AppGeoBlocker({
  children,
  appLoaded,
}: {
  children: React.ReactNode;
  appLoaded: () => void;
}) {
  const [blocked, setBlocked] = useState<boolean>(false);

  const { isLoading, isError, data } = useQuery({
    queryKey: ["geoBlockerStatus"],
    queryFn: async () => {
      const res = await fetch("https://countervalues-service.api.ledger-test.com/", {
        method: "POST",
        headers: {
          "x-ledger-ofac-test": "true",
        },
        body: "X",
      });
      return res.status;
    },
    retry: false,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (isLoading) return;
    if (data === 451) {
      setBlocked(true);
    } else {
      setBlocked(false);
    }
    typeof appLoaded === "function" && appLoaded();
  }, [isLoading, isError, data, appLoaded]);

  if (blocked)
    return (
      <GradientDiv
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        height="100%"
        rowGap={3}
      >
        <Container>
          <Icons.DeleteCircleFill size="L" color="error.c60" />
        </Container>
        <Text variant="bodyLineHeight" color="neutral.c100" fontSize={24}>
          <Trans i18nKey="geoBlocking.title" />
        </Text>
        <Text variant="body" fontSize={14} color="neutral.c70">
          <Trans i18nKey="geoBlocking.description" />
        </Text>
        <Link
          size="medium"
          color="neutral.c100"
          Icon={() => <Icons.ExternalLink size="S" />}
          href="https://support.ledger.com/hc/en-us/articles/4405789828820"
          padding={3}
          border={1}
          borderStyle="solid"
          borderColor="opacity.c50"
          borderRadius={500}
        >
          <Trans i18nKey="geoBlocking.learnMore" />
        </Link>
      </GradientDiv>
    );

  return children;
}
