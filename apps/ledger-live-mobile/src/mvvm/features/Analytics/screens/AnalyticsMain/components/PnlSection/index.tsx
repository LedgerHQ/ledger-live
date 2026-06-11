import React from "react";
import {
  Box,
  Subheader,
  SubheaderRow,
  SubheaderTitle,
  SubheaderShowMore,
} from "@ledgerhq/lumen-ui-rnative";
import { PnlCard } from "LLM/features/Pnl/components/PnlCard";
import { PnlDetailDrawer } from "LLM/features/Pnl/components/PnlDetailDrawer";
import { PNL_SECTION_TEST_IDS } from "./testIds";
import { usePnlSectionViewModel } from "./usePnlSectionViewModel";

export { PNL_SECTION_TEST_IDS };

export default function PnlSection() {
  const { shouldDisplayPnl, title, unrealised, realised, openDrawer, drawer } =
    usePnlSectionViewModel();

  if (!shouldDisplayPnl) return null;

  return (
    <Box lx={{ gap: "s12", paddingHorizontal: "s16" }} testID={PNL_SECTION_TEST_IDS.root}>
      <Subheader>
        <SubheaderRow onPress={openDrawer} testID={PNL_SECTION_TEST_IDS.title}>
          <SubheaderTitle>{title}</SubheaderTitle>
          <SubheaderShowMore />
        </SubheaderRow>
      </Subheader>
      <Box lx={{ flexDirection: "row", gap: "s8" }}>
        <Box lx={{ flex: 1 }}>
          <PnlCard
            type="value"
            title={unrealised.title}
            value={unrealised.value}
            trend={unrealised.trend}
            testID={PNL_SECTION_TEST_IDS.unrealisedCard}
          />
        </Box>
        <Box lx={{ flex: 1 }}>
          <PnlCard
            type="value"
            title={realised.title}
            value={realised.value}
            trend={realised.trend}
            testID={PNL_SECTION_TEST_IDS.realisedCard}
          />
        </Box>
      </Box>
      <PnlDetailDrawer
        isOpen={drawer.isOpen}
        onClose={drawer.onClose}
        title={drawer.title}
        description={drawer.description}
        items={drawer.items}
        footer={drawer.footer}
        pageName={drawer.pageName}
        source={drawer.source}
        testID={PNL_SECTION_TEST_IDS.detailDrawer}
      />
    </Box>
  );
}
