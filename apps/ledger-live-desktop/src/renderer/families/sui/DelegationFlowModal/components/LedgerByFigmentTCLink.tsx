import React from "react";
import { P2P_SUI_VALIDATOR_ADDRESS } from "@ledgerhq/live-common/families/sui/constants";
import { Transaction } from "@ledgerhq/live-common/families/sui/types";
import LinkWithExternalIcon from "~/renderer/components/LinkWithExternalIcon";
import { useTranslation } from "react-i18next";
import { urls } from "~/config/urls";
import { openURL } from "~/renderer/linking";

const LedgerByFigmentTC = ({ transaction }: { transaction: Transaction }) => {
  const { t } = useTranslation();
  const openLedgerByFigmentTC = () => openURL(urls.ledgerByFigmentTC);
  if (transaction.recipient !== P2P_SUI_VALIDATOR_ADDRESS) {
    return null;
  }
  return (
    <LinkWithExternalIcon
      label={t("sui.stake.flow.steps.validator.ledgerByFigmentTC")}
      onClick={openLedgerByFigmentTC}
    />
  );
};
export default LedgerByFigmentTC;
