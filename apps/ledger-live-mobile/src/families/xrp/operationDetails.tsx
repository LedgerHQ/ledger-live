import React from "react";
import { XrpOperation } from "@ledgerhq/live-common/families/xrp/types";
import { useTranslation } from "~/context/Locale";
import Section from "~/screens/OperationDetails/Section";

type Props = {
  operation: XrpOperation;
};

function OperationDetailsExtra({ operation: { extra } }: Props) {
  const { t } = useTranslation();
  const memo = extra?.memo;

  if (!memo) return null;

  return <Section title={t("operationDetails.extra.memo")} value={memo} />;
}

export default {
  OperationDetailsExtra,
};
