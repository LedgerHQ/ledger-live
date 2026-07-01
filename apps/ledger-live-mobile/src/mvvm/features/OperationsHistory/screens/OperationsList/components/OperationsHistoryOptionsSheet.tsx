import React from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  BottomSheetHeader,
  BottomSheetView,
  ListItem,
  ListItemContent,
  ListItemDescription,
  ListItemLeading,
  ListItemTitle,
  Spot,
} from "@ledgerhq/lumen-ui-rnative";
import QueuedDrawerBottomSheet from "LLM/components/QueuedDrawer/QueuedDrawerBottomSheet";
import type { OperationsHistoryDustFilterOption } from "../useOperationsListViewModel";

type Props = Readonly<{
  isOpen: boolean;
  dustFilterOption: OperationsHistoryDustFilterOption | undefined;
  onClose: () => void;
  onToggle: () => void;
}>;

export function OperationsHistoryOptionsSheet({
  isOpen,
  dustFilterOption,
  onClose,
  onToggle,
}: Props) {
  const { bottom } = useSafeAreaInsets();
  if (!dustFilterOption) return null;

  const { Icon, title, description } = dustFilterOption;

  return (
    <QueuedDrawerBottomSheet
      testID="operations-history-options-sheet"
      isRequestingToBeOpened={isOpen}
      enableDynamicSizing
      onClose={onClose}
    >
      <BottomSheetView style={{ paddingBottom: bottom + 24 }}>
        <BottomSheetHeader />
        <ListItem onPress={onToggle} testID="operations-history-toggle-dust-filter">
          <ListItemLeading>
            <Spot appearance="icon" icon={Icon} />
            <ListItemContent>
              <ListItemTitle>{title}</ListItemTitle>
              <ListItemDescription>{description}</ListItemDescription>
            </ListItemContent>
          </ListItemLeading>
        </ListItem>
      </BottomSheetView>
    </QueuedDrawerBottomSheet>
  );
}
