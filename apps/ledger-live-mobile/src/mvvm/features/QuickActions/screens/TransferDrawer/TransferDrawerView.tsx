import React from "react";
import { Box, BottomSheetView, BottomSheetHeader } from "@ledgerhq/lumen-ui-rnative";
import { TransferAction } from "../../types";
import TransferListItem from "./TransferListItem";
import { QUICK_ACTIONS_TEST_IDS } from "../../testIds";
interface TransferDrawerViewProps {
  readonly actions: readonly TransferAction[];
  readonly title: string;
  readonly bottomInset: number;
}

export const TransferDrawerView = ({ actions, title, bottomInset }: TransferDrawerViewProps) => {
  return (
    <BottomSheetView style={{ paddingBottom: bottomInset + 24, paddingHorizontal: 16 }}>
      <BottomSheetHeader title={title} appearance="expanded" />
      <Box
        style={{ marginHorizontal: -8 }}
        testID={QUICK_ACTIONS_TEST_IDS.transferDrawer.container}
      >
        {actions.map(action => (
          <TransferListItem key={action.id} action={action} />
        ))}
      </Box>
    </BottomSheetView>
  );
};
