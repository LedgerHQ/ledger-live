import React from "react";
import { useTranslation } from "@shared/i18n";
import { DialogHeader } from "@ledgerhq/lumen-ui-react";
import { DISCLOSURE_COPY } from "../../documents";
import { AcknowledgementContent } from "./AcknowledgementContent";
import type { ConsentContentProps } from "./ConsentContent.types";

export function ConsentContent({ version, onAccept }: ConsentContentProps) {
  const { t } = useTranslation();
  const disclosure = DISCLOSURE_COPY[version.disclosureVersion];

  return (
    <>
      <DialogHeader
        density="expanded"
        title={t("predictions.onboarding.consent.title")}
        description={t("predictions.onboarding.consent.description")}
      />
      <AcknowledgementContent
        id="predictions-consent-acknowledgement"
        acknowledgement={t(disclosure.checkbox)}
        cta={t("predictions.onboarding.consent.cta")}
        disclaimer={t(disclosure.footer)}
        onConfirm={onAccept}
      >
        <ul className="flex list-disc flex-col gap-20 pl-20">
          {disclosure.bullets.map(bullet => (
            <li key={bullet} className="body-2 text-muted">
              {t(bullet)}
            </li>
          ))}
        </ul>
      </AcknowledgementContent>
    </>
  );
}
