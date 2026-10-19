import React from "react";
import { useTranslation } from "react-i18next";
import {
  DataTable,
  DataTableRoot,
  Subheader,
  SubheaderRow,
  SubheaderTitle,
} from "@ledgerhq/lumen-ui-react";
import type { AssetsSectionViewModel } from "./useAssetsSectionViewModel";

type Props = Readonly<{ viewModel: AssetsSectionViewModel }>;

export function AssetsSectionView({ viewModel }: Props) {
  const { t } = useTranslation();

  if (!viewModel.isVisible) return null;

  return (
    <section className="flex flex-col gap-12" data-testid="account-detail-assets">
      <Subheader>
        <SubheaderRow>
          <SubheaderTitle>{t("accountDetail.assets.title")}</SubheaderTitle>
        </SubheaderRow>
      </Subheader>
      <DataTableRoot table={viewModel.table} appearance="plain" stickyHeader={false}>
        <DataTable />
      </DataTableRoot>
    </section>
  );
}
