import React from "react";
import { Text } from "@ledgerhq/lumen-ui-rnative";
import { getProviderName } from "@ledgerhq/live-common/exchange/swap/utils/index";
import { InlineTextLink } from "LLM/components/InlineTextLink";
import { getSwapTermsCopy } from "LLM/utils/getSwapTermsCopy";
import { Trans } from "~/context/Locale";

type SwapTermsFooterProps = Readonly<{
  provider: string;
  /** The network fees are paid by a sponsor, who also receives the transaction details. */
  sponsored: boolean;
}>;

/**
 * The legal line under the swap confirmation: the terms of the swap provider the user accepts by
 * approving on the device. Same notices as the legacy confirmation, in the signing drawer's style.
 */
export function SwapTermsFooter({ provider, sponsored }: SwapTermsFooterProps) {
  const { providerName, acceptTerms, links } = getSwapTermsCopy(provider);
  if (!links.length) {
    return null;
  }

  return (
    <Text
      typography="body2"
      lx={{ color: "muted", textAlign: "center", paddingHorizontal: "s16" }}
      testID="wallet-api-exchange-terms"
    >
      <Trans
        i18nKey={acceptTerms}
        values={{ provider: getProviderName(providerName) }}
        components={links.map(url => (
          <InlineTextLink key={url} href={url} />
        ))}
      />
      {sponsored && (
        <>
          {" "}
          <Trans i18nKey="DeviceAction.confirmSwap.acceptTermsSponsored" />
        </>
      )}
    </Text>
  );
}
