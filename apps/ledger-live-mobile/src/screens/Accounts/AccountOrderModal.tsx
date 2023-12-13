import React from "react";
import { useTranslation } from "react-i18next";
import OrderOption from "./OrderOption";
import QueuedDrawer from "~/components/QueuedDrawer";

const choices = ["balance|desc", "balance|asc", "name|asc", "name|desc"];

type Props = {
  isOpened: boolean;
  onClose: () => void;
};

export default function AccountOrderModal({ onClose, isOpened }: Props) {
  const { t } = useTranslation();
  return (
    <QueuedDrawer onClose={onClose} isRequestingToBeOpened={isOpened} title={t("common.sortBy")}>
      {choices.map(id => (
        <OrderOption key={id} id={id} />
      ))}
    </QueuedDrawer>
  );
}
