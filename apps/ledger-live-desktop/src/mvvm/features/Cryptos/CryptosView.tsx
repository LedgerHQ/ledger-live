import React from "react";
import {
  Button,
  SearchInput,
  TableActionBar,
  TableActionBarLeading,
  TableActionBarTrailing,
} from "@ledgerhq/lumen-ui-react";
import { Plus } from "@ledgerhq/lumen-ui-react/symbols";
import PageHeader from "LLD/components/PageHeader";
import TrackPage from "~/renderer/analytics/TrackPage";
import { useTranslation } from "react-i18next";
import type { CryptosViewModel } from "./types";
import { CryptosTable } from "LLD/features/Cryptos/components/CryptosTable";

export default function CryptosView({ viewModel }: { readonly viewModel: CryptosViewModel }) {
  const {
    searchValue,
    setSearchValue,
    onAddAddressClick,
    onAccountClick,
    rows,
    lookupParentAccount,
  } = viewModel;
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-32">
      <TrackPage category="Cryptos" />
      <PageHeader title={t("cryptos.title")} />
      <div data-testid="cryptos-page-content" className="flex flex-col gap-12">
        <TableActionBar>
          <TableActionBarLeading>
            <div className="max-w-[350px] flex-auto pt-4">
              <SearchInput
                value={searchValue}
                placeholder={t("cryptos.tableActions.searchAddress")}
                onChange={e => setSearchValue(e.target.value)}
              />
            </div>
          </TableActionBarLeading>
          <TableActionBarTrailing>
            <Button
              appearance="base"
              size="sm"
              icon={Plus}
              onClick={onAddAddressClick}
              data-testid="cryptos-add-address-button"
            >
              {t("cryptos.tableActions.addAddress")}
            </Button>
          </TableActionBarTrailing>
        </TableActionBar>
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
