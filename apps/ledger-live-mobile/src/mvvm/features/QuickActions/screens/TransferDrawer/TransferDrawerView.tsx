import React from "react";
import { Box, BottomSheetView, BottomSheetHeader } from "@ledgerhq/lumen-ui-rnative";
import { TransferAction } from "../../types";
import TransferListItem from "./TransferListItem";
import { QUICK_ACTIONS_TEST_IDS } from "../../testIds";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface TransferDrawerViewProps {
  readonly actions: readonly TransferAction[];
  readonly title: string;
}

export const TransferDrawerView = ({ actions, title }: TransferDrawerViewProps) => {
  const { bottom: bottomInset } = useSafeAreaInsets();

  return (
    <BottomSheetView style={{ paddingBottom: bottomInset + 24 }}>
      <BottomSheetHeader title={title} appearance="expanded" />
      <Box testID={QUICK_ACTIONS_TEST_IDS.transferDrawer.container}>
        {actions.map(action => (
          <TransferListItem key={action.id} action={action} />
        ))}
      </Box>
    </BottomSheetView>
  );
};
