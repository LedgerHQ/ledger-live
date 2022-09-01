import React from "react";
import { useTranslation } from "react-i18next";
import type { AccountLike } from "@ledgerhq/types-live";
import Section from "../../screens/OperationDetails/Section";

type OperationDetailsExtraProps = {
  extra: Record<string, string>;
  type: string;
  account: AccountLike | null | undefined;
};

const OperationDetailsExtra = ({ extra, type }: OperationDetailsExtraProps) => {
  const { t } = useTranslation();
  const entries = Object.keys(extra);

  return (
    type === "REDEEM" || type === "SUPPLY"
      ? entries.filter(key => !["compoundValue", "rate"].includes(key))
      : entries
  ).map(key => (
    <Section
      title={t(`operationDetails.extra.${key}`)}
      value={`${extra[key]}`}
    />
  ));
};

export default {
  OperationDetailsExtra,
};
