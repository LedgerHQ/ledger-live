import React from "react";
import { useTranslation } from "react-i18next";
import Section from "../../screens/OperationDetails/Section";

type Props = {
  extra: {
    transferId?: string;
  };
};

function OperationDetailsExtra({ extra }: Props) {
  const { t } = useTranslation();
  return (
    <>
      {extra.transferId && (
        <Section
          title={t("operationDetails.extra.transferId")}
          value={extra.transferId}
        />
      )}
    </>
  );
}

export default {
  OperationDetailsExtra,
};
