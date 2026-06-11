import React from "react";
import { Box } from "@ledgerhq/lumen-ui-rnative";
import type { DistributionItem } from "@ledgerhq/types-live";
import { PnlCard } from "LLM/features/Pnl/components/PnlCard";
import { PnlDetailDrawer } from "LLM/features/Pnl/components/PnlDetailDrawer";
import { SectionSkeleton } from "../SectionSkeleton";
import { ASSET_DETAIL_PNL_TEST_IDS } from "./testIds";
import { useShouldDisplayAssetPnl } from "./useShouldDisplayAssetPnl";
import { useAssetPnlViewModel } from "./useAssetPnlViewModel";

export { ASSET_DETAIL_PNL_TEST_IDS };

type Props = Readonly<{
  distributionItem: DistributionItem | undefined;
  isLoading: boolean;
}>;

export function PnLSection({ distributionItem, isLoading }: Props) {
  const enabled = useShouldDisplayAssetPnl(distributionItem);

  if (isLoading && !distributionItem) {
    return <SectionSkeleton rows={1} rowHeight="s56" />;
  }

  if (!enabled || !distributionItem) return null;

  return <PnLSectionContent distributionItem={distributionItem} enabled={enabled} />;
}

function PnLSectionContent({
  distributionItem,
  enabled,
}: Readonly<{
  distributionItem: DistributionItem;
  enabled: boolean;
}>) {
  const { unrealised, secondary, pnlDrawer, secondaryDrawer } = useAssetPnlViewModel({
    distributionItem,
    enabled,
  });

  return (
    <>
      <Box lx={{ flexDirection: "row", gap: "s8" }} testID={ASSET_DETAIL_PNL_TEST_IDS.root}>
        <Box lx={{ flex: 1 }}>
          <PnlCard
            type="interactive"
            title={unrealised.title}
            value={unrealised.value}
            trend={unrealised.trend}
            onPress={unrealised.onPress}
            testID={ASSET_DETAIL_PNL_TEST_IDS.unrealisedCard}
          />
        </Box>
        <Box lx={{ flex: 1 }}>
          <PnlCard
            type="info"
            title={secondary.title}
            value={secondary.value}
            onPress={secondary.onPress}
            testID={ASSET_DETAIL_PNL_TEST_IDS.secondaryCard}
          />
        </Box>
      </Box>
      <PnlDetailDrawer
        isOpen={pnlDrawer.isOpen}
        onClose={pnlDrawer.onClose}
        title={pnlDrawer.title}
        description={pnlDrawer.description}
        items={pnlDrawer.items}
        footer={pnlDrawer.footer}
        pageName={pnlDrawer.pageName}
        source={pnlDrawer.source}
        testID={ASSET_DETAIL_PNL_TEST_IDS.detailDrawer}
      />
      <PnlDetailDrawer
        isOpen={secondaryDrawer.isOpen}
        onClose={secondaryDrawer.onClose}
        title={secondaryDrawer.title}
        bodyText={secondaryDrawer.bodyText}
        pageName={secondaryDrawer.pageName}
        source={secondaryDrawer.source}
        testID={ASSET_DETAIL_PNL_TEST_IDS.secondaryDrawer}
      />
    </>
  );
}
