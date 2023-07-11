import React from "react";
import { useTranslation } from "react-i18next";
import Section from "../../screens/OperationDetails/Section";

type Props = {
  extra: {
    memo?: string;
  };
};

function OperationDetailsExtra({ extra }: Props) {
  const { t } = useTranslation();
  return (
    <>
      {extra.memo && <Section title={t("operationDetails.extra.memo")} value={extra.memo || ""} />}
    </>
  );
}

export default {
  OperationDetailsExtra,
};
