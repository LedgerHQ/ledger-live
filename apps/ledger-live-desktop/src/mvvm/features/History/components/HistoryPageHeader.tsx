import React from "react";
import PageHeader from "LLD/components/PageHeader";
import { useTranslation } from "react-i18next";

export default function HistoryPageHeader({ onBack }: { readonly onBack: () => void }) {
  const { t } = useTranslation();

  return <PageHeader title={t("history.title")} onBack={onBack} />;
}
