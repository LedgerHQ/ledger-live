import React, { type ReactNode } from "react";
import { Trans } from "react-i18next";
import { DialogBody, Link } from "@ledgerhq/lumen-ui-react";

type SponsoredRentSignatureScreenViewProps = Readonly<{
  strategyLabel: string;
  feeLabel: string;
  feeAmountLabel: string | null;
  providerName: string;
  /** Null hides the terms notice. */
  termsUrl: string | null;
  onOpenTerms: () => void;
  children: ReactNode;
}>;

type TermsLinkProps = Readonly<{
  href: string;
  onOpen: () => void;
  // Filled in by Trans with the link text.
  children?: ReactNode;
}>;

function TermsLink({ href, onOpen, children }: TermsLinkProps) {
  return (
    <Link
      appearance="accent"
      size="sm"
      href={href}
      onClick={e => {
        e.preventDefault();
        onOpen();
      }}
      data-testid="send-sponsored-rent-signature-terms-link"
    >
      {children}
    </Link>
  );
}

export function SponsoredRentSignatureScreenView({
  strategyLabel,
  feeLabel,
  feeAmountLabel,
  providerName,
  termsUrl,
  onOpenTerms,
  children,
}: SponsoredRentSignatureScreenViewProps) {
  return (
    <DialogBody className="gap-8 -mt-12 pt-2" data-testid="send-sponsored-rent-signature">
      {feeAmountLabel ? (
        <div className="flex flex-col gap-4">
          <p className="m-0 body-3 text-muted">{strategyLabel}</p>
          <div className="flex items-center justify-between">
            <span className="body-2">{feeLabel}</span>
            <span className="body-2">{feeAmountLabel}</span>
          </div>
        </div>
      ) : null}
      {children}
      {termsUrl ? (
        <p
          className="m-0 body-3 text-muted text-center"
          data-testid="send-sponsored-rent-signature-terms"
        >
          <Trans
            i18nKey="newSendFlow.sponsoredRentSignature.terms"
            values={{ provider: providerName }}
            components={[<TermsLink key="terms" href={termsUrl} onOpen={onOpenTerms} />]}
          />
        </p>
      ) : null}
    </DialogBody>
  );
}
