import React from "react";
import { useTranslation } from "react-i18next";
import Section from "~/screens/OperationDetails/Section";
import type { CasperOperation } from "@ledgerhq/live-common/families/casper/types";

type Props = {
  operation: CasperOperation;
};

function OperationDetailsExtra({ operation }: Props) {
  const { t } = useTranslation();
  return (
    <>
      {operation.extra.transferId && (
        <Section
          title={t("operationDetails.extra.transferId")}
          value={operation.extra.transferId}
        />
      )}
    </>
  );
}

export default {
  OperationDetailsExtra,
};
