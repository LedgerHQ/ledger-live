import React from "react";
import PageHeader from "LLD/components/PageHeader";
import { useTranslation } from "react-i18next";

type Props = Readonly<{
  onBack: () => void;
}>;

export default function HistoryPageHeader({ onBack }: Props) {
  const { t } = useTranslation();

  return <PageHeader title={t("history.title")} onBack={onBack} />;
}
