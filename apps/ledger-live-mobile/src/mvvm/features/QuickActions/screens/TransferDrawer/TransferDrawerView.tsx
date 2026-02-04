import React from "react";
import { Box, Text } from "@ledgerhq/lumen-ui-rnative";
import { TransferAction } from "../../types";
import TransferListItem from "./TransferListItem";
import { BottomSheetView } from "@gorhom/bottom-sheet";
import { QUICK_ACTIONS_TEST_IDS } from "../../testIds";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface TransferDrawerViewProps {
  readonly actions: readonly TransferAction[];
  readonly title: string;
}

export const TransferDrawerView = ({ actions, title }: TransferDrawerViewProps) => {
  const { bottom: bottomInset } = useSafeAreaInsets();

  return (
    <BottomSheetView style={{ paddingBottom: bottomInset + 24, paddingTop: 32 }}>
      <Box testID={QUICK_ACTIONS_TEST_IDS.transferDrawer.container}>
        <Text
          typography="heading2SemiBold"
          lx={{ marginBottom: "s16", marginLeft: "s6", color: "base" }}
        >
          {title}
        </Text>
        {actions.map(action => (
          <TransferListItem key={action.id} action={action} />
        ))}
      </Box>
    </BottomSheetView>
  );
};
