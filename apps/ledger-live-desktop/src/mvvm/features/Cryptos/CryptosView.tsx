import React from "react";
import PageHeader from "LLD/components/PageHeader";
import TrackPage from "~/renderer/analytics/TrackPage";
import { useTranslation } from "react-i18next";
import type { CryptosViewModel } from "./types";
import TableActions from "LLD/features/Cryptos/components/TableActions";
import { CryptosTable } from "LLD/features/Cryptos/components/CryptosTable";
import { useCryptosTableData } from "LLD/features/Cryptos/hooks/useCryptosTableData";

export default function CryptosView({ viewModel }: { readonly viewModel: CryptosViewModel }) {
  const { navigateToDashboard, searchValue, setSearchValue, onAccountClick } = viewModel;
  const { t } = useTranslation();
  const { rows, lookupParentAccount } = useCryptosTableData(searchValue);

  return (
    <div className="flex flex-col gap-32">
      <TrackPage category="Cryptos" />
      <PageHeader title={t("cryptos.title")} onBack={navigateToDashboard} />
      <div data-testid="cryptos-page-content" className="flex flex-col gap-12">
        <TableActions searchValue={searchValue} setSearchValue={setSearchValue} />
        {rows.length === 0 ? (
          <p className="py-16 text-center text-body" data-testid="cryptos-table-empty">
            {t("cryptos.table.emptyState")}
          </p>
        ) : (
          <CryptosTable
            rows={rows}
            lookupParentAccount={lookupParentAccount}
            onRowClick={onAccountClick}
          />
        )}
      </div>
    </div>
  );
}
