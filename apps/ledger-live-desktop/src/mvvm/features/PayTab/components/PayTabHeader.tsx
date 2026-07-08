import React from "react";
import { useTranslation } from "react-i18next";
import PageHeader from "LLD/components/PageHeader";

export default function PayTabHeader() {
  const { t } = useTranslation();

  return <PageHeader title={t("sidebar.paytab")} />;
}
