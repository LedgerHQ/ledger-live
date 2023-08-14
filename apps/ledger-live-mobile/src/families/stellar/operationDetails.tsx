import React from "react";
import { useTranslation } from "react-i18next";
import Section from "../../screens/OperationDetails/Section";

type Props = {
  extra: {
    memo?: string;
    assetCode?: string;
    assetIssuer?: string;
  };
};

function OperationDetailsExtra({ extra }: Props) {
  const { t } = useTranslation();
  return (
    <>
      {extra.assetCode && <Section title={t("stellar.assetCode")} value={extra.assetCode} />}
      {extra.assetIssuer && <Section title={t("stellar.assetIssuer")} value={extra.assetIssuer} />}
      {extra.memo && <Section title={t("operationDetails.extra.memo")} value={extra.memo} />}
    </>
  );
}

export default {
  OperationDetailsExtra,
};
