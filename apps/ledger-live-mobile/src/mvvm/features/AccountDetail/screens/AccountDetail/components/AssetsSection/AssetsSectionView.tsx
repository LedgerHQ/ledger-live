import React from "react";
import { Box, Subheader, SubheaderRow, SubheaderTitle } from "@ledgerhq/lumen-ui-rnative";
import type { LumenViewStyle } from "@ledgerhq/lumen-ui-rnative/styles";
import AssetListItem from "LLM/components/AssetListItem";
import { useTranslation } from "~/context/Locale";
import { ACCOUNT_DETAIL_TEST_IDS } from "../../../../testIds";
import type { AssetsSectionViewModel } from "./useAssetsSectionViewModel";

type Props = AssetsSectionViewModel;

export function AssetsSectionView({ assets, precomputed }: Props) {
  const { t } = useTranslation();

  return (
    <Box testID={ACCOUNT_DETAIL_TEST_IDS.assets}>
      <Subheader>
        <SubheaderRow lx={{ marginBottom: "s12" }}>
          <SubheaderTitle>{t("accountDetail.assets.title")}</SubheaderTitle>
        </SubheaderRow>
      </Subheader>
      {assets.map(asset => {
        const data = precomputed.get(asset.currency.id);
        if (!data) return null;
        return (
          <AssetListItem
            key={asset.currency.id}
            asset={asset}
            precomputed={data}
            lx={rowStyle}
            hideNetwork
          />
        );
      })}
    </Box>
  );
}

const rowStyle: LumenViewStyle = { marginHorizontal: "-s8" };
