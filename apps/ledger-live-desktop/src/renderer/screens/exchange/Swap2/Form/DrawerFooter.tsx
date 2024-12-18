import { getProviderName } from "@ledgerhq/live-common/exchange/swap/utils/index";
import React, { useCallback, useEffect, useState } from "react";
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

  const url = providerData?.termsOfUseUrl;
  const onLinkClick = useCallback(() => openURL(url!), [url]);
  if (!url) {
    return null;
  }
  const providerName = getProviderName(provider);
  const acceptTerms =
    providerName === "Exodus"
      ? "DeviceAction.swap.exodusAcceptTerms"
      : "DeviceAction.swap.acceptTerms";

  return (
    <Box mt={1} mb={5} mx={3}>
      <Terms>
        <Trans
          i18nKey={acceptTerms}
          values={{
            provider: providerName,
          }}
          components={[
            <LinkWithExternalIcon
              key="termsExternalLink"
              fontSize={13}
              color="palette.text.shade60"
              onClick={onLinkClick}
              style={{
                textDecoration: "underline",
              }}
            />,
          ]}
        />
      </Terms>
    </Box>
  );
}
