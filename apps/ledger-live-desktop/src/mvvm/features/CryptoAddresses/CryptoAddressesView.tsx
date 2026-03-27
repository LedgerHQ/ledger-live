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
import type { CryptoAddressesViewModel } from "./types";
import { CryptoTable } from "./components/Table/CryptoTable";
import { CryptoTableEmptyState } from "./components/Table/CryptoTableEmptyState";
import { CRYPTO_TRACKING_PAGE_NAME } from "./constants";

export function CryptoAddressesView({
  viewModel,
}: {
  readonly viewModel: CryptoAddressesViewModel;
}) {
  const {
    searchValue,
    setSearchValue,
    emptyTableMessage,
    onAddAddressClick,
    onAccountClick,
    rows,
    lookupParentAccount,
  } = viewModel;
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-32 pb-32">
      <TrackPage category={CRYPTO_TRACKING_PAGE_NAME} />
      <PageHeader title={t("cryptoAddresses.title")} />
      <div data-testid="crypto-page-content" className="flex flex-col gap-12">
        <TableActionBar>
          <TableActionBarLeading>
            <div className="max-w-[350px] flex-auto pt-4">
              <SearchInput
                value={searchValue}
                placeholder={t("cryptoAddresses.tableActions.searchAddress")}
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
              data-testid="crypto-add-address-button"
            >
              {t("cryptoAddresses.tableActions.addAddress")}
            </Button>
          </TableActionBarTrailing>
        </TableActionBar>
        {rows.length === 0 ? (
          <CryptoTableEmptyState message={emptyTableMessage} />
        ) : (
          <CryptoTable
            rows={rows}
            lookupParentAccount={lookupParentAccount}
            onRowClick={onAccountClick}
          />
        )}
      </div>
    </div>
  );
}
