import React from "react";
import { Trans } from "react-i18next";
import { getProviderTermsOfUseUrl } from "@ledgerhq/live-common/exchange/swap/utils/index";
import { openURL } from "~/renderer/linking";
import { PERPS_DEPOSIT_PROVIDER_ID } from "LLD/features/Perps/constants/depositFunding";

export const PerpsDepositSignTerms = () => {
  const termsUrl = getProviderTermsOfUseUrl(PERPS_DEPOSIT_PROVIDER_ID);

  return (
    <p className="body-4 text-muted text-center">
      <Trans
        i18nKey="perpsDepositSign.terms"
        components={{
          termsLink: termsUrl ? (
            <button
              type="button"
              className="inline cursor-pointer border-0 bg-transparent p-0 underline body-4 text-muted"
              onClick={() => openURL(termsUrl)}
            />
          ) : (
            <span />
          ),
        }}
      />
    </p>
  );
};
