import React from "react";
import { Trans } from "react-i18next";
import { urls } from "~/config/urls";
import Alert from "~/renderer/components/Alert";
import type { AleoAccount, AleoTokenAccount } from "@ledgerhq/live-common/families/aleo/types";
import { getMaxPrivateRecordsForAccount } from "./utils";

type Props = { account: AleoAccount | AleoTokenAccount };

const InfoBanner = ({ account }: Props) => {
  const max = getMaxPrivateRecordsForAccount(account);

  return (
    <Alert type="secondary" small learnMoreUrl={urls.maxSpendable} learnMoreOnRight>
      <div className="flex flex-col gap-1">
        <div className="inline-flex">
          <Trans i18nKey="aleo.shared.infoBanner.descPartOne" />
        </div>
        <div className="inline-flex">
          <Trans i18nKey="aleo.shared.infoBanner.descPartTwo" values={{ max }} />
        </div>
      </div>
    </Alert>
  );
};
export default InfoBanner;
