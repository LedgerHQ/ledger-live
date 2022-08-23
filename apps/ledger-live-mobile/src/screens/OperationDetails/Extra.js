// @flow
import React from "react";
import { useTranslation } from "react-i18next";
import Section from "./Section";

type Props = {
  extra: { [key: string]: string },
};

export default function OperationDetailsExtra({ extra }: Props) {
  const { t } = useTranslation();

  return (
    <>
      {Object.entries(extra).map(([key, value]) => (
        <Section
          title={t(`operationDetails.extra.${key}`)}
          value={String(value)}
        />
      ))}
    </>
  );
}
