import React, { type ReactNode } from "react";
import { Trans } from "react-i18next";
import { Link } from "@ledgerhq/lumen-ui-react";
import {
  dexProvidersContractAddress,
  privacyPolicy,
  termsOfUse,
} from "@ledgerhq/live-common/exchange/providers/swap";
import { resolveWalletApiTerms } from "@features/platform-wallet-api-sign";
import { openURL } from "~/renderer/linking";

export type TermsAndConditionsFooterProps = Readonly<{
  manifestId: string;
  manifestName?: string;
  recipient?: string;
}>;

type TermsLinkProps = Readonly<{
  href: string;
  children?: ReactNode;
}>;

const termsSources = {
  dexProvidersContractAddress,
  termsOfUse,
  privacyPolicy,
};

function TermsLink({ href, children }: TermsLinkProps): React.ReactElement {
  return (
    <Link
      appearance="accent"
      size="sm"
      href={href}
      onClick={event => {
        event.preventDefault();
        openURL(href);
      }}
    >
      {children}
    </Link>
  );
}

export function TermsAndConditionsFooter({
  manifestId,
  manifestName,
  recipient,
}: TermsAndConditionsFooterProps): React.ReactElement | null {
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
    <TermsLink key="terms" href={termsOfUseUrl} />,
    ...(privacyUrl ? [<TermsLink key="privacy" href={privacyUrl} />] : []),
  ];

  return (
    <p className="px-16 text-center body-2 text-muted" data-testid="wallet-api-signature-terms">
      <Trans
        i18nKey={
          privacyUrl
            ? "walletApiSignTransaction.sign.termsAndConditionsWithPrivacy"
            : "walletApiSignTransaction.sign.termsAndConditions"
        }
        values={{ appName }}
        components={linkComponents}
      />
    </p>
  );
}
