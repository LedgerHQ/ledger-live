import React from "react";
import { Text } from "@ledgerhq/react-ui";
import { useTranslation } from "react-i18next";
import RowLayout from "./RowLayout";

export const TableHeader = () => {
  const { t } = useTranslation();

  const Column = (translationKey: string) => (
    <Text variant="bodyLineHeight" fontSize={12} color="neutral.c70">
      {t(translationKey)}
    </Text>
  );

  const firstColumn = Column("ordinals.rareSats.table.type");
  const secondColumn = Column("ordinals.rareSats.table.year");

  return (
    <RowLayout
      firstColumnElement={firstColumn}
      secondColumnElement={secondColumn}
      bgColor="opacityDefault.c05"
    />
  );
};
