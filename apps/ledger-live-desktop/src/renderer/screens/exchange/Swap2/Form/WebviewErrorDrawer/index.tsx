import React from "react";
import { Trans, useTranslation } from "react-i18next";
import styled from "styled-components";
import TrackPage from "~/renderer/analytics/TrackPage";
import Box from "~/renderer/components/Box";
import { useGetSwapTrackingProperties } from "../../utils/index";
import { BoxedIcon, Text } from "@ledgerhq/react-ui";
import ErrorIcon from "~/renderer/components/ErrorIcon";
import times from "lodash/times";
import random from "lodash/random";
import get from "lodash/get";

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
  color: "neutral.c100",
  textAlign: "center",
  fontSize: 6,
})`
  user-select: text;
  margin-bottom: 10px;
  margin-top: 20px;
`;

const ErrorDescription = styled(Text).attrs({
  variant: "paragraph",
  color: "neutral.c70",
  textAlign: "center",
  fontSize: 4,
  whiteSpace: "pre-wrap",
})`
  user-select: text;
`;

const generateRandomString = (numberOfChars: number = 4): string => {
  return times(numberOfChars, () => random(35).toString(36))
    .join("")
    .toUpperCase();
};

export default function WebviewErrorDrawer(error?: Error) {
  const swapDefaultTrack = useGetSwapTrackingProperties();
  let titleKey = "swap2.webviewErrorDrawer.title";
  let descriptionKey = "swap2.webviewErrorDrawer.description";
  const { t } = useTranslation();

  // Error code section
  const swapCode = get(error, "cause.swapCode");
  const correlationId = get(error, "cause.correlationId");

  const messageKey =
    get(error, "cause.response.data.error.messageKey") || get(error, "cause.messageKey");

  if (messageKey) {
    switch (messageKey) {
      case "WRONG_OR_EXPIRED_RATE_ID":
        titleKey = "errors.SwapRateExpiredError.title";
        descriptionKey = "errors.SwapRateExpiredError.description";
        break;
      case "TRANSACTION_CANNOT_BE_CREATED":
        titleKey = "errors.TransactionCannotBeCreated.title";
        descriptionKey = t("errors.TransactionCannotBeCreated.description", {
          randomCode: generateRandomString(),
        });
        break;
      case "SWAP_QUOTE_LOW_LIQUIDITY":
        titleKey = "errors.SwapQuoteLowLiquidity.title";
        descriptionKey = "errors.SwapQuoteLowLiquidity.description";
        break;
    }
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
          {swapCode && <ErrorCodeSection swapCode={swapCode} correlationId={correlationId} />}
        </ErrorDescription>
      </Box>
    </ContentBox>
  );
}

function ErrorCodeSection({
  swapCode,
  correlationId,
}: {
  swapCode: string | undefined;
  correlationId: string | undefined;
}) {
  return (
    <div className="flex flex-col rounded-md bg-surface gap-8 p-8 mt-20">
      <ErrorBlock dictionaryKey="swap2.webviewErrorDrawer.code" value={swapCode} />
      <ErrorBlock dictionaryKey="swap2.webviewErrorDrawer.correlationId" value={correlationId} />
    </div>
  );
}

function ErrorBlock({
  dictionaryKey,
  value,
}: {
  dictionaryKey: string;
  value: string | undefined;
}) {
  if (!value) {
    return null;
  }

  return (
    <div className="flex flex-row justify-between">
      <span className="text-sm text-muted basis-1/3 text-left">
        <Trans i18nKey={dictionaryKey} />
      </span>
      <span className="text-sm text-base basis-2/3 text-right">{value}</span>
    </div>
  );
}
