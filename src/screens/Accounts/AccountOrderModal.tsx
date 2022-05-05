import React from "react";
import { useTranslation } from "react-i18next";
import { BottomDrawer } from "@ledgerhq/native-ui";
import OrderOption from "./OrderOption";

const choices = ["balance|desc", "balance|asc", "name|asc", "name|desc"];

type Props = {
  isOpened: boolean;
  onClose: () => void;
};

export default function AccountOrderModal({ onClose, isOpened }: Props) {
  const { t } = useTranslation();
  return (
    <BottomDrawer
      id="AccountOrderModal"
      onClose={onClose}
      isOpen={isOpened}
      title={t("common.sortBy")}
    >
      {choices.map(id => (
        <OrderOption key={id} id={id} />
      ))}
    </BottomDrawer>
  );
}
