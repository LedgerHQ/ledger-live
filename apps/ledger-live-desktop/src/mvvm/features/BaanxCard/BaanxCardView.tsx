import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import PageHeader from "LLD/components/PageHeader";
import TrackPage from "~/renderer/analytics/TrackPage";
import { BaanxLoginForm } from "./components/BaanxLoginForm";
import { RawDataTab } from "./components/RawDataTab";
import { ResultsTab } from "./components/ResultsTab";
import { TransactionsTab } from "./components/TransactionsTab";
import type { BaanxCardViewModel } from "./useBaanxCardViewModel";

type TabId = "app" | "transactions" | "results" | "debug";

export function BaanxCardView(viewModel: Readonly<BaanxCardViewModel>) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<TabId>("transactions");

  const successCount = viewModel.apiResults.filter(q => q.data && !q.error).length;

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-16">
      <TrackPage category="BaanxCard" />
      <PageHeader title={t("baanxCard.title")} onBack={viewModel.navigateBack} />

      <div className="flex items-center gap-4">
        <TabButton
          active={activeTab === "app"}
          onClick={() => setActiveTab("app")}
          label={t("baanxCard.tabs.app")}
        />
        <TabButton
          active={activeTab === "transactions"}
          onClick={() => setActiveTab("transactions")}
          label="Transactions"
        />
        <TabButton
          active={activeTab === "results"}
          onClick={() => setActiveTab("results")}
          label={`Results${successCount > 0 ? ` (${successCount})` : ""}`}
          badge={successCount > 0}
        />
        <TabButton
          active={activeTab === "debug"}
          onClick={() => setActiveTab("debug")}
          label={`Debug${viewModel.apiLog.length > 0 ? ` (${viewModel.apiLog.length})` : ""}`}
        />
      </div>

      <div className="flex min-h-0 flex-1">
        <div className={`flex-1 ${activeTab === "app" ? "flex flex-col" : "hidden"}`}>
          <BaanxLoginForm
            url={viewModel.webAppUrl}
            isAuthenticated={viewModel.isAuthenticated}
            onStorageExtracted={viewModel.onStorageExtracted}
            onApiLogUpdated={viewModel.onApiLogUpdated}
          />
        </div>

        {activeTab === "transactions" && (
          <div className="flex-1 overflow-auto">
            <TransactionsTab
              accessToken={viewModel.accessToken}
              isAuthenticated={viewModel.isAuthenticated}
              fiatCurrency={viewModel.fiatCurrency}
            />
          </div>
        )}

        {activeTab === "results" && (
          <div className="flex-1 overflow-auto">
            <ResultsTab
              queries={viewModel.apiResults}
              isAuthenticated={viewModel.isAuthenticated}
              accessToken={viewModel.accessToken}
            />
          </div>
        )}

        {activeTab === "debug" && (
          <div className="flex-1 overflow-auto">
            <RawDataTab
              webViewStorage={viewModel.webViewStorage}
              apiLog={viewModel.apiLog}
              isAuthenticated={viewModel.isAuthenticated}
            />
          </div>
        )}
      </div>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  label,
  badge,
}: {
  readonly active: boolean;
  readonly onClick: () => void;
  readonly label: string;
  readonly badge?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-6 rounded-sm px-12 py-6 text-sm font-medium transition-colors ${
        active
          ? "bg-primary text-on-primary"
          : "bg-surface text-muted hover:bg-surface-hover"
      }`}
    >
      {label}
      {badge && (
        <span className="inline-block h-6 w-6 rounded-full bg-green-500" />
      )}
    </button>
  );
}
