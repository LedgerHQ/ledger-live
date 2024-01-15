import React from "react";
import { useTranslation } from "react-i18next";
import Section from "~/screens/OperationDetails/Section";
import { StacksOperation } from "@ledgerhq/live-common/families/stacks/types";

type Props = {
  operation: StacksOperation;
};

function OperationDetailsExtra({ operation }: Props) {
  const { t } = useTranslation();
  return (
    <>
      {operation.extra.memo && (
        <Section title={t("operationDetails.extra.memo")} value={operation.extra.memo || ""} />
      )}
    </>
  );
}

export default {
  OperationDetailsExtra,
};
