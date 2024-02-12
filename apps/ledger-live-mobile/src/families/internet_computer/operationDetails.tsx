import React from "react";
import { useTranslation } from "react-i18next";
import Section from "~/screens/OperationDetails/Section";
import { InternetComputerOperation } from "@ledgerhq/live-common/families/internet_computer/types";

type Props = {
  operation: InternetComputerOperation;
};

function OperationDetailsExtra({ operation }: Props) {
  const { t } = useTranslation();
  return (
    <>
      {operation.extra.memo && (
        <Section title={t("operationDetails.extra.memo")} value={operation.extra.memo} />
      )}
    </>
  );
}

export default {
  OperationDetailsExtra,
};
