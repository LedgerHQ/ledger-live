import React from "react";
import { useTranslation } from "react-i18next";
import { Link } from "@ledgerhq/lumen-ui-react";

type PayCardDisclaimerProps = Readonly<{
  onOpenCardApp: () => void;
}>;

export function PayCardDisclaimer({ onOpenCardApp }: PayCardDisclaimerProps) {
  const { t } = useTranslation();

  return (
    <p className="mt-24 body-3 text-muted" data-testid="pay-card-disclaimer">
      {t("payTab.cardDisclaimer")}{" "}
      <Link appearance="inherit" size="inherit" asChild>
        <button type="button" onClick={onOpenCardApp}>
          {t("payTab.cardDisclaimerLink")}
        </button>
      </Link>
    </p>
  );
}
