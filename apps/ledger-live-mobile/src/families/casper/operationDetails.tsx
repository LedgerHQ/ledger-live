import React from "react";
import { useTranslation } from "react-i18next";
import Section from "../../screens/OperationDetails/Section";
import { CasperOperation } from "@ledgerhq/live-common/families/casper/types";

function OperationDetailsExtra({ extra }: CasperOperation) {
  const { t } = useTranslation();
  return (
    <>
      {extra.transferId && (
        <Section title={t("operationDetails.extra.transferId")} value={extra.transferId} />
      )}
    </>
  );
}

export default {
  OperationDetailsExtra,
};
