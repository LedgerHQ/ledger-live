import React from "react";
import { Text } from "@ledgerhq/lumen-ui-rnative";
import {
  dexProvidersContractAddress,
  privacyPolicy,
  termsOfUse,
} from "@ledgerhq/live-common/exchange/providers/swap";
import { resolveWalletApiTerms } from "@features/platform-wallet-api-sign";
import { Trans } from "~/context/Locale";
import { InlineTextLink } from "LLM/components/InlineTextLink";

export type TermsAndConditionsFooterProps = Readonly<{
  manifestId: string;
  manifestName?: string;
  recipient?: string;
}>;

const termsSources = {
  dexProvidersContractAddress,
  termsOfUse,
  privacyPolicy,
};

export function TermsAndConditionsFooter({
  manifestId,
  manifestName,
  recipient,
}: TermsAndConditionsFooterProps) {
  const resolvedTerms = resolveWalletApiTerms({
    manifestId,
    manifestName,
    recipient,
    sources: termsSources,
  });

  if (!resolvedTerms) {
    return null;
  }

  const { appName, termsOfUseUrl, privacyUrl } = resolvedTerms;

  const linkComponents = [
    <InlineTextLink key="terms" href={termsOfUseUrl} />,
    ...(privacyUrl ? [<InlineTextLink key="privacy" href={privacyUrl} />] : []),
  ];

  return (
    <Text
      typography="body2"
      lx={{ color: "muted", textAlign: "center", paddingHorizontal: "s16" }}
      testID="wallet-api-signature-terms"
    >
      <Trans
        i18nKey={
          privacyUrl
            ? "walletApiSignTransaction.sign.termsAndConditionsWithPrivacy"
            : "walletApiSignTransaction.sign.termsAndConditions"
        }
        values={{ appName }}
        components={linkComponents}
      />
    </Text>
  );
}
