import { getProviderName } from "@ledgerhq/live-common/exchange/swap/utils/index";
import React, { useEffect, useMemo, useState } from "react";
import { Trans } from "react-i18next";
import styled from "styled-components";
import Box from "~/renderer/components/Box/Box";
import LinkWithExternalIcon from "~/renderer/components/LinkWithExternalIcon";
import Text from "~/renderer/components/Text";
import { openURL } from "~/renderer/linking";
import {
  getSwapProvider,
  AdditionalProviderConfig,
} from "@ledgerhq/live-common/exchange/providers/swap";
import useFeature from "@ledgerhq/live-common/featureFlags/useFeature";

const Terms = styled(Text).attrs({
  ff: "Inter|SemiBold",
  color: "neutral.c70",
  fontSize: 13,
})``;

export function DrawerFooter({ provider, sponsored }: { provider: string; sponsored?: boolean }) {
  const [providerData, setproviderData] = useState<AdditionalProviderConfig>();

  useEffect(() => {
    const getProvideData = async () => {
      const data = await getSwapProvider(provider);
      setproviderData(data);
    };
    getProvideData();
  }, [provider]);

  const ptxSwapLiveAppKycWarning = useFeature("ptxSwapLiveAppKycWarning");
  const url = providerData?.termsOfUseUrl;
  const providerName = getProviderName(provider);
  const ptxSwapDetailedView = useFeature("ptxSwapDetailedView");
  const isDetailedViewEnabled = !!ptxSwapDetailedView?.enabled;

  const { acceptTerms, urls } = useMemo(() => {
    if (!ptxSwapLiveAppKycWarning?.enabled) {
      let acceptTermsKey = "DeviceAction.swap.acceptTerms";
      if (providerName === "Exodus") {
        acceptTermsKey = "DeviceAction.swap.exodusAcceptTerms";
      } else if (providerName === "NEAR Intents") {
        acceptTermsKey = "DeviceAction.swap.nearIntentsAcceptTerms";
      }
      return {
        acceptTerms: acceptTermsKey,
        urls: [url],
      };
    }
    switch (providerName) {
      case "Exodus":
        return {
          acceptTerms: "DeviceAction.swap.exodusAcceptTerms",
          urls: [url],
        };
      case "Changelly": {
        if (isDetailedViewEnabled) {
          return {
            acceptTerms: "DeviceAction.swap.changellyAcceptTerms",
            urls: providerData?.usefulUrls,
          };
        } else {
          return {
            acceptTerms: "DeviceAction.swap.changellySimplifiedAcceptTerms",
            urls: providerData?.usefulUrls,
          };
        }
      }
      case "CIC":
        return {
          acceptTerms: "DeviceAction.swap.cicAcceptTerms",
          urls: providerData?.usefulUrls,
        };
      case "NEAR Intents":
        return {
          acceptTerms: "DeviceAction.swap.nearIntentsAcceptTerms",
          urls: [url],
        };
      default:
        return {
          acceptTerms: "DeviceAction.swap.acceptTerms",
          urls: [url],
        };
    }
  }, [
    providerData?.usefulUrls,
    providerName,
    ptxSwapLiveAppKycWarning?.enabled,
    url,
    isDetailedViewEnabled,
  ]);

  if (!url) {
    return null;
  }

  return (
    <Box mt={1} mb={5} mx={3}>
      <Terms>
        <Trans
          i18nKey={acceptTerms}
          values={{
            provider: providerName,
          }}
          components={urls?.map((usefulUrl, idx) => (
            <LinkWithExternalIcon
              key={`external-link-${idx}`}
              fontSize={13}
              color="neutral.c70"
              onClick={() => openURL(usefulUrl!)}
              style={{ textDecoration: "underline" }}
            />
          ))}
        />
        {sponsored && (
          <>
            {" "}
            <Trans i18nKey="DeviceAction.swap.acceptTermsSponsored" />
          </>
        )}
      </Terms>
    </Box>
  );
}
