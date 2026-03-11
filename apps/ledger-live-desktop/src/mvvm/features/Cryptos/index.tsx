import React from "react";
import PageHeader from "LLD/components/PageHeader";
import TrackPage from "~/renderer/analytics/TrackPage";
import useCryptosViewModel from "./useCryptosViewModel";
import type { CryptosViewModel } from "./types";
import { useTranslation } from "react-i18next";

export default function Cryptos() {
  const viewModel = useCryptosViewModel();
  return <CryptosView viewModel={viewModel} />;
}

function CryptosView({ viewModel }: { readonly viewModel: CryptosViewModel }) {
  const { navigateToDashboard } = viewModel;
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-32">
      <TrackPage category="Accounts" />
      <PageHeader title={t("accounts.title")} onBack={navigateToDashboard} />
      <div data-testid="cryptos-page-content" />
    </div>
  );
}
