import React from "react";
import { Trans } from "react-i18next";
import styled from "styled-components";
import TrackPage from "~/renderer/analytics/TrackPage";
import Box from "~/renderer/components/Box";
import { useGetSwapTrackingProperties } from "../../utils/index";
import { BoxedIcon, Text } from "@ledgerhq/react-ui";
import { SwapLiveError } from "@ledgerhq/live-common/exchange/swap/types";
import ErrorIcon from "~/renderer/components/ErrorIcon";

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

export default function WebviewErrorDrawer(error?: SwapLiveError) {
  const swapDefaultTrack = useGetSwapTrackingProperties();
  let titleKey = "swap2.webviewErrorDrawer.title";
  let descriptionKey = "swap2.webviewErrorDrawer.description";
  let errorCodeSection = null;

  if (error?.cause?.swapCode) {
    switch (error.cause.swapCode) {
      case "swap010":
        errorCodeSection = <Trans i18nKey="errors.PayinExtraIdError.message" />;
        break;
      default:
        errorCodeSection = (
          <Trans
            mr={2}
            i18nKey="swap2.webviewErrorDrawer.code"
            values={{
              errorCode: error.cause.swapCode,
            }}
          />
        );
        break;
    }
  }
  switch (error?.cause?.response?.data?.error?.messageKey) {
    case "WRONG_OR_EXPIRED_RATE_ID":
      titleKey = "errors.SwapRateExpiredError.title";
      descriptionKey = "errors.SwapRateExpiredError.description";
      errorCodeSection = null;
      break;
  }

  return (
    <ContentBox>
      <TrackPage category="Swap" name="Webview error drawer" {...swapDefaultTrack} {...error} />
      <Box mt={3} flow={4} mx={5}>
        <Logo>
          <Box alignSelf="center">
            <BoxedIcon
              Icon={() => <ErrorIcon error={error} size={24} />}
              size={64}
              iconSize={24}
              iconColor={"neutral.c100"}
            />
          </Box>
        </Logo>
        <ErrorTitle>
          <Trans i18nKey={titleKey} />
        </ErrorTitle>
        <ErrorDescription>
          <Trans i18nKey={descriptionKey} />
          <div>{errorCodeSection} </div>
        </ErrorDescription>
      </Box>
    </ContentBox>
  );
}
