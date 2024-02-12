import React from "react";
import { useTranslation } from "react-i18next";
import { Operation } from "@ledgerhq/types-live";
import Section from "./Section";

type Props = {
  operation: Operation;
};
export default function OperationDetailsExtra({ operation }: Props) {
  const { t } = useTranslation();

  // Safety type checks
  return operation.extra &&
    typeof operation.extra === "object" &&
    !Array.isArray(operation.extra) ? (
    <>
      {Object.entries(operation.extra as object).map(([key, value]) => (
        <Section title={t(`operationDetails.extra.${key}`)} value={String(value)} key={key} />
      ))}
    </>
  ) : (
    <></>
  );
}
