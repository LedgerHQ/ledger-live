import React from "react";
import QueuedBottomSheet from "LLM/components/QueuedDrawer/QueuedBottomSheet";
import {
  BottomSheetHeader,
  BottomSheetView,
  ListItem,
  ListItemContent,
  ListItemLeading,
  ListItemTitle,
  Spot,
} from "@ledgerhq/lumen-ui-rnative";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useMoreOptionsBottomSheetViewModel } from "./useMoreOptionsBottomSheetViewModel";

type Props = Readonly<{
  isRequestingToBeOpened: boolean;
  onClose: () => void;
  isSellAvailable: boolean;
  isEarnAvailable: boolean;
  onSellPress: () => void;
  onEarnPress: () => void;
}>;

export function MoreOptionsBottomSheet({
  isRequestingToBeOpened,
  onClose,
  isSellAvailable,
  isEarnAvailable,
  onSellPress,
  onEarnPress,
}: Props) {
  const { bottom: bottomInset } = useSafeAreaInsets();
  const { options } = useMoreOptionsBottomSheetViewModel({
    isSellAvailable,
    isEarnAvailable,
    onClose,
    onSellPress,
    onEarnPress,
  });

  return (
    <QueuedBottomSheet
      isRequestingToBeOpened={isRequestingToBeOpened}
      onClose={onClose}
      enableDynamicSizing
    >
      <BottomSheetView style={{ paddingBottom: bottomInset + 24 }}>
        <BottomSheetHeader />
        {options.map(({ id, icon, label, testID, onPress }) => (
          <ListItem key={id} onPress={onPress} testID={testID}>
            <ListItemLeading>
              <Spot appearance="icon" icon={icon} />
              <ListItemContent>
                <ListItemTitle>{label}</ListItemTitle>
              </ListItemContent>
            </ListItemLeading>
          </ListItem>
        ))}
      </BottomSheetView>
    </QueuedBottomSheet>
  );
}
