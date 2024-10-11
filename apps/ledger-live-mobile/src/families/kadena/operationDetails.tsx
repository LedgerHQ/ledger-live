import { KadenaOperation } from "@ledgerhq/live-common/families/kadena/types";
import React from "react";
import { useTranslation } from "react-i18next";
import Section from "~/screens/OperationDetails/Section";

type Props = {
  operation: KadenaOperation;
};

function OperationDetailsExtra({ operation }: Props) {
  const { t } = useTranslation();
  return (
    <>
      <Section
        title={t("operationDetails.extra.senderChainId")}
        value={operation.extra.senderChainId}
      />
      <Section
        title={t("operationDetails.extra.receiverChainId")}
        value={operation.extra.receiverChainId}
      />
    </>
  );
}

export default {
  OperationDetailsExtra,
};
