import React from "react";
import { getOperationDetailsExtraFields } from "@ledgerhq/live-common/families/aleo/utils";
import type { AleoOperation } from "@ledgerhq/live-common/families/aleo/types";
import { useTranslation } from "~/context/Locale";
import Section from "~/screens/OperationDetails/Section";

interface OperationDetailsExtraProps {
  operation: AleoOperation;
}

const OperationDetailsExtra = ({ operation }: OperationDetailsExtraProps) => {
  const { t } = useTranslation();

  const extraFields = getOperationDetailsExtraFields(operation.extra);

  return (
    <>
      {extraFields.map(item => (
        <Section
          title={t(`operationDetails.extra.${item.key}`)}
          value={String(item.value)}
          key={item.key}
        />
      ))}
    </>
  );
};

export default {
  OperationDetailsExtra,
};
