import React from "react";
import { Trans } from "react-i18next";
import { urls } from "~/config/urls";
import Alert from "~/renderer/components/Alert";
import { MAX_PRIVATE_RECORDS_PER_TRANSACTION } from "@ledgerhq/live-common/families/aleo/constants";

const InfoBanner = () => (
  <Alert type="secondary" small learnMoreUrl={urls.maxSpendable} learnMoreOnRight>
    <div className="flex flex-col gap-1">
      <div className="inline-flex">
        <Trans i18nKey="aleo.shared.infoBanner.descPartOne" />
      </div>
      <div className="inline-flex">
        <Trans
          i18nKey="aleo.shared.infoBanner.descPartTwo"
          values={{ max: MAX_PRIVATE_RECORDS_PER_TRANSACTION }}
        />
      </div>
    </div>
  </Alert>
);
export default InfoBanner;
