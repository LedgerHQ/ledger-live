import React, { type ReactNode } from "react";
import { Trans, useTranslation } from "@shared/i18n";
import { useLocalizedUrl, useOpenLink } from "@shared/linking";
import { DialogBody, DialogHeader, Link } from "@ledgerhq/lumen-ui-react";
import { DISCLAIMER_COPY, TERMS_OF_USE_URLS } from "../../documents";
import { Acknowledgement } from "./Acknowledgement";
import type { TermsContentProps } from "./TermsContent.types";

// Trans fills in the link text, so its children are only known at render.
function TermsOfUseLink({
  children,
  onClick,
}: Readonly<{ children?: ReactNode; onClick: () => void }>) {
  return (
    <Link appearance="inherit" size="inherit" underline onClick={onClick}>
      {children}
    </Link>
  );
}

export function TermsContent({ versions, onAccept }: TermsContentProps) {
  const { t } = useTranslation();
  const openLink = useOpenLink();
  const termsOfUseUrl = useLocalizedUrl(TERMS_OF_USE_URLS[versions.termsVersion]);
  const disclaimer = DISCLAIMER_COPY[versions.disclaimerVersion];

  return (
    <>
      <DialogHeader className="mb-0" title={t("predictions.onboarding.terms.title")} />
      <DialogBody>
        <p className="body-2 text-base">
          <Trans
            i18nKey={disclaimer.body}
            components={{
              termsLink: <TermsOfUseLink onClick={() => openLink(termsOfUseUrl)} />,
            }}
          />
        </p>
      </DialogBody>
      <Acknowledgement
        acknowledgement={t(disclaimer.checkbox)}
        cta={t("predictions.onboarding.terms.cta")}
        onConfirm={onAccept}
      />
    </>
  );
}
