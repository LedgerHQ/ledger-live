import React from "react";
import { useTranslation } from "react-i18next";
import Section from "~/screens/OperationDetails/Section";
import { StellarOperation } from "@ledgerhq/live-common/families/stellar/types";
import { formatMemo } from "@ledgerhq/live-common/families/stellar/ui";

type Props = {
  operation: StellarOperation;
};

function OperationDetailsExtra({ operation: { extra } }: Props) {
  const { t } = useTranslation();
  const memo = formatMemo(extra);
  return (
    <>
      {extra.assetCode && <Section title={t("stellar.assetCode")} value={extra.assetCode} />}
      {extra.assetIssuer && <Section title={t("stellar.assetIssuer")} value={extra.assetIssuer} />}
      {memo && <Section title={t("operationDetails.extra.memo")} value={memo} />}
    </>
  );
}

export default {
  OperationDetailsExtra,
};
