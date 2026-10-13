import React, { useMemo } from "react";
import { Text } from "@ledgerhq/lumen-ui-rnative";
import { getProviderName } from "@ledgerhq/live-common/exchange/swap/utils/index";
import { InlineTextLink } from "LLM/components/InlineTextLink";
import { Trans } from "~/context/Locale";
import { urls } from "~/utils/urls";

type TermsProviders = keyof typeof urls.swap.providers;

const CHANGELLY_PROVIDER = "changelly";
const NEAR_INTENTS_PROVIDER = "nearintents";

function isTermsProvider(name: string): name is TermsProviders {
  return name in urls.swap.providers;
}

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
  // changelly_v2 and the like share the Changelly links.
  const providerName = provider.includes(CHANGELLY_PROVIDER) ? CHANGELLY_PROVIDER : provider;
  const providerUrls = isTermsProvider(providerName)
    ? urls.swap.providers[providerName]
    : undefined;

  const { acceptTerms, linkUrls } = useMemo(() => {
    if (providerName === NEAR_INTENTS_PROVIDER) {
      return {
        acceptTerms: "DeviceAction.confirmSwap.nearIntentsAcceptTerms",
        linkUrls: [providerUrls?.tos],
      };
    }
    if (providerName === CHANGELLY_PROVIDER) {
      return {
        acceptTerms: "DeviceAction.confirmSwap.changellySimplifiedAcceptTerms",
        linkUrls: [
          providerUrls?.tos,
          providerUrls && "amlKyc" in providerUrls ? providerUrls.amlKyc : undefined,
          providerUrls && "support" in providerUrls ? providerUrls.support : undefined,
        ],
      };
    }
    return {
      acceptTerms: "DeviceAction.confirmSwap.acceptTerms",
      linkUrls: [providerUrls?.tos],
    };
  }, [providerName, providerUrls]);

  const links = linkUrls.filter((url): url is string => Boolean(url));
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
