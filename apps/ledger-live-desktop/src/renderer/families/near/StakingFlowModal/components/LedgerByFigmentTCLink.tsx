import React from "react";
import { FIGMENT_NEAR_VALIDATOR_ADDRESS } from "@ledgerhq/live-common/families/near/logic";
import { Transaction } from "@ledgerhq/live-common/families/near/types";
import LinkWithExternalIcon from "~/renderer/components/LinkWithExternalIcon";
import { useTranslation } from "react-i18next";
import { urls } from "~/config/urls";
import { openURL } from "~/renderer/linking";
const LedgerByFigmentTC = ({ transaction }: { transaction: Transaction }) => {
  const { t } = useTranslation();
  const openLedgerByFigmentTC = () => openURL(urls.ledgerByFigmentTC);
  if (transaction.recipient !== FIGMENT_NEAR_VALIDATOR_ADDRESS) {
    return null;
  }
  return (
    <LinkWithExternalIcon
      label={t("near.stake.flow.steps.validator.ledgerByFigmentTC")}
      onClick={openLedgerByFigmentTC}
    />
  );
};
export default LedgerByFigmentTC;
