import { getProviderName } from "@ledgerhq/live-common/exchange/swap/utils/index";
import React, { useCallback, useEffect, useMemo, useState } from "react";
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
  color: "palette.text.shade60",
  fontSize: 13,
})``;

export function DrawerFooter({ provider }: { provider: string }) {
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
  const onLinkClick = useCallback((link: string) => openURL(link!), []);
  const providerName = getProviderName(provider);

  const { acceptTerms, linksComponents } = useMemo(() => {
    let acceptTerms: string;
    let linksComponents: React.JSX.Element[] = [];

    if (!ptxSwapLiveAppKycWarning?.enabled) {
      acceptTerms =
        providerName === "Exodus"
          ? "DeviceAction.swap.exodusAcceptTerms"
          : "DeviceAction.swap.acceptTerms";
      linksComponents = [
        <LinkWithExternalIcon
          key="termsExternalLink"
          fontSize={13}
          color="palette.text.shade60"
          onClick={() => onLinkClick(url!)}
          style={{
            textDecoration: "underline",
          }}
        />,
      ];
    } else {
      switch (providerName) {
        case "Exodus":
          acceptTerms = "DeviceAction.swap.exodusAcceptTerms";
          linksComponents = [
            <LinkWithExternalIcon
              key="termsExternalLink"
              fontSize={13}
              color="palette.text.shade60"
              onClick={() => onLinkClick(url!)}
              style={{
                textDecoration: "underline",
              }}
            />,
          ];
          break;
        case "Changelly":
          acceptTerms = "DeviceAction.swap.changellyAcceptTerms";
          linksComponents =
            providerData?.usefulUrls?.map((usefulUrl, idx) => (
              <LinkWithExternalIcon
                key={`external-link-${idx}`}
                fontSize={13}
                color="palette.text.shade60"
                onClick={() => onLinkClick(usefulUrl)}
                style={{ textDecoration: "underline" }}
              />
            )) ?? [];
          break;
        default:
          acceptTerms = "DeviceAction.swap.acceptTerms";
          linksComponents = [
            <LinkWithExternalIcon
              key="termsExternalLink"
              fontSize={13}
              color="palette.text.shade60"
              onClick={() => onLinkClick(url!)}
              style={{
                textDecoration: "underline",
              }}
            />,
          ];
          break;
      }
    }

    return { acceptTerms, linksComponents };
  }, [ptxSwapLiveAppKycWarning?.enabled, providerName, providerData, url, onLinkClick]);

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
          components={linksComponents}
        />
      </Terms>
    </Box>
  );
}
