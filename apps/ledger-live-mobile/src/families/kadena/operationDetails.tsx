import { KADENA_CROSS_CHAIN_TRANSFER_FINISHER_URL } from "@ledgerhq/live-common/families/kadena/constants";
import { KadenaOperation } from "@ledgerhq/live-common/families/kadena/types";
import React from "react";
import { Trans, useTranslation } from "react-i18next";
import Alert from "~/components/Alert";
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

      {operation.extra.receiverChainId !== operation.extra.senderChainId ? (
        <Alert
          type="secondary"
          learnMoreKey={"operationDetails.extra.completeCrossChainTransfer"}
          learnMoreUrl={`${KADENA_CROSS_CHAIN_TRANSFER_FINISHER_URL}?reqKey=${operation.hash}`}
        >
          <Trans i18nKey="errors.KadenaCrossChainTransfer" />
        </Alert>
      ) : null}
    </>
  );
}

export default {
  OperationDetailsExtra,
};
