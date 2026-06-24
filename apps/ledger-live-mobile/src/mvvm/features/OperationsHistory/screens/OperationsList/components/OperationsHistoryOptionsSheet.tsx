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
import { Eye, EyeCross } from "@ledgerhq/lumen-ui-rnative/symbols";
import QueuedDrawerBottomSheet from "LLM/components/QueuedDrawer/QueuedDrawerBottomSheet";
import { useTranslation } from "~/context/Locale";

type Props = Readonly<{
  isOpen: boolean;
  isFilterEnabled: boolean;
  threshold: string;
  onClose: () => void;
  onToggle: () => void;
}>;

export function OperationsHistoryOptionsSheet({
  isOpen,
  isFilterEnabled,
  threshold,
  onClose,
  onToggle,
}: Props) {
  const { t } = useTranslation();
  const { bottom } = useSafeAreaInsets();
  const Icon = isFilterEnabled ? Eye : EyeCross;
  const title = isFilterEnabled
    ? t("operationsList.options.showDustTransactions")
    : t("operationsList.options.hideDustTransactions");

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
              <ListItemDescription>
                {t("operationsList.options.dustTransactionsDescription", { threshold })}
              </ListItemDescription>
            </ListItemContent>
          </ListItemLeading>
        </ListItem>
      </BottomSheetView>
    </QueuedDrawerBottomSheet>
  );
}
