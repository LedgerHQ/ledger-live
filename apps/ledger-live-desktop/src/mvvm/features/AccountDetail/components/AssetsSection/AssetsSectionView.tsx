import React, { type ReactNode } from "react";
import { DataTable, DataTableRoot } from "@ledgerhq/lumen-ui-react";
import type { AssetsSectionViewModel } from "./useAssetsSectionViewModel";

type Props = Readonly<{ viewModel: AssetsSectionViewModel; header: ReactNode }>;

export function AssetsSectionView({ viewModel, header }: Props) {
  return (
    <section className="flex flex-col gap-12" data-testid="account-detail-assets">
      {header}
      <DataTableRoot table={viewModel.table} appearance="plain" stickyHeader={false}>
        <DataTable />
      </DataTableRoot>
    </section>
  );
}
