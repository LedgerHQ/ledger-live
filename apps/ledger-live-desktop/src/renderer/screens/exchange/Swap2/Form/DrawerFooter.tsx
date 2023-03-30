import { getProviderName } from "@ledgerhq/live-common/exchange/swap/utils/index";
import React, { useCallback } from "react";
import { Trans } from "react-i18next";
import styled from "styled-components";
import { urls } from "~/config/urls";
import Box from "~/renderer/components/Box/Box";
import LinkWithExternalIcon from "~/renderer/components/LinkWithExternalIcon";
import Text from "~/renderer/components/Text";
import { openURL } from "~/renderer/linking";
import { ThemedComponent } from "~/renderer/styles/StyleProvider";
import { Separator } from "./Separator";
const Terms: ThemedComponent<{}> = styled(Text).attrs({
  ff: "Inter|SemiBold",
  color: "palette.text.shade60",
  fontSize: 13,
})`
  white-space: pre-line;
`;
export function DrawerFooter({ provider }: { provider: string }) {
  const url = urls.swap.providers[provider]?.tos;
  const onLinkClick = useCallback(() => openURL(url), [url]);
  if (!url) {
    return null;
  }
  const providerName = getProviderName(provider);
  return (
    <>
      <Separator />
      <Box mx="22px" mb="7px">
        <Terms>
          <Trans
            i18nKey={"DeviceAction.swap.acceptTerms"}
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
    </>
  );
}
