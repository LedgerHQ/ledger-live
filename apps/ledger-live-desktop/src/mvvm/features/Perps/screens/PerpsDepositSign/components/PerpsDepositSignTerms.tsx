import React from "react";
import { Trans } from "react-i18next";
import { openURL } from "~/renderer/linking";

const SWAPKIT_TERMS_URL = "https://swapkit.dev/terms-of-service/";

export const PerpsDepositSignTerms = () => (
  <p className="body-4 text-muted text-center">
    <Trans
      i18nKey="perpsDepositSign.terms"
      components={{
        termsLink: (
          <button
            type="button"
            className="inline cursor-pointer border-0 bg-transparent p-0 underline body-4 text-muted"
            onClick={() => openURL(SWAPKIT_TERMS_URL)}
          />
        ),
      }}
    />
  </p>
);
