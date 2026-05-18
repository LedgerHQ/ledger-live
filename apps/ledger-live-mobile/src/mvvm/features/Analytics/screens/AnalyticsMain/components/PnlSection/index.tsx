import React from "react";
import { Box } from "@ledgerhq/lumen-ui-rnative";
import { PnlCard } from "LLM/features/Pnl/components/PnlCard";
import { PnlDetailDrawer } from "LLM/features/Pnl/components/PnlDetailDrawer";
import { PNL_SECTION_TEST_IDS } from "./testIds";
import { usePnlSectionViewModel } from "./usePnlSectionViewModel";

export { PNL_SECTION_TEST_IDS };

export default function PnlSection() {
  const { shouldRender, unrealised, costBasis, pnlDrawer, costBasisDrawer } =
    usePnlSectionViewModel();

  if (!shouldRender) return null;

  return (
    <>
      <Box
        lx={{ flexDirection: "row", gap: "s8", paddingHorizontal: "s16" }}
        testID={PNL_SECTION_TEST_IDS.root}
      >
        <Box lx={{ flex: 1 }}>
          <PnlCard
            type="interactive"
            title={unrealised.title}
            value={unrealised.value}
            trend={unrealised.trend}
            onPress={unrealised.onPress}
            testID={PNL_SECTION_TEST_IDS.unrealisedCard}
          />
        </Box>
        <Box lx={{ flex: 1 }}>
          <PnlCard
            type="info"
            title={costBasis.title}
            value={costBasis.value}
            onPress={costBasis.onPress}
            testID={PNL_SECTION_TEST_IDS.costBasisCard}
          />
        </Box>
      </Box>
      <PnlDetailDrawer
        isOpen={pnlDrawer.isOpen}
        onClose={pnlDrawer.onClose}
        title={pnlDrawer.title}
        description={pnlDrawer.description}
        items={pnlDrawer.items}
        testID={PNL_SECTION_TEST_IDS.detailDrawer}
      />
      <PnlDetailDrawer
        isOpen={costBasisDrawer.isOpen}
        onClose={costBasisDrawer.onClose}
        title={costBasisDrawer.title}
        bodyText={costBasisDrawer.bodyText}
        testID={PNL_SECTION_TEST_IDS.costBasisDrawer}
      />
    </>
  );
}
