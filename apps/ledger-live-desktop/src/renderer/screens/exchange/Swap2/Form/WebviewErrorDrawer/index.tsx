import React from "react";
import { Trans } from "react-i18next";
import styled from "styled-components";
import TrackPage from "~/renderer/analytics/TrackPage";
import Box from "~/renderer/components/Box";
import { useGetSwapTrackingProperties } from "../../utils/index";
import { Text } from "@ledgerhq/react-ui";
import ErrorNoBorder from "~/renderer/icons/ErrorNoBorder";

const ContentBox = styled(Box)`
  display: flex;
  justify-content: center;
  height: 100%;
`;

const Logo = styled(Box)`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: ${p => p.theme.colors.alertRed};
`;

const ErrorTitle = styled(Text).attrs({
  variant: "paragraph",
  fontWeight: "semiBold",
  color: "palette.text.shade100",
  textAlign: "center",
  fontSize: 6,
})`
  user-select: text;
  margin-bottom: 10px;
  margin-top: 20px;
`;

const ErrorDescription = styled(Text).attrs({
  variant: "paragraph",
  color: "palette.text.shade60",
  textAlign: "center",
  fontSize: 4,
  whiteSpace: "pre-wrap",
})`
  user-select: text;
`;

export type SwapLiveError = {
  origin: "swap-web-app";
  type?: string;
  cause: {
    message?: string;
    swapCode?: string;
  };
};

export default function WebviewErrorDrawer(error?: SwapLiveError) {
  const swapDefaultTrack = useGetSwapTrackingProperties();
  return (
    <ContentBox>
      <TrackPage category="Swap" name="Webview error drawer" {...swapDefaultTrack} {...error} />

      <Box mt={3} flow={4} mx={5}>
        <Logo>
          <ErrorNoBorder size={44} />
        </Logo>
        <ErrorTitle>
          <Trans i18nKey="swap2.webviewErrorDrawer.title" />
        </ErrorTitle>
        <ErrorDescription>
          <Trans i18nKey={`swap2.webviewErrorDrawer.description`} />
          {error?.cause?.swapCode && (
            <Trans
              mr={2}
              i18nKey={`swap2.webviewErrorDrawer.code`}
              values={{
                errorCode: error.cause.swapCode,
              }}
            />
          )}
        </ErrorDescription>
      </Box>
    </ContentBox>
  );
}
