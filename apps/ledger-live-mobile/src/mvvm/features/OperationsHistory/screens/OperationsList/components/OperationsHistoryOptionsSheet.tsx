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
import { Csv } from "@ledgerhq/lumen-ui-rnative/symbols";
import { QueuedBottomSheet } from "@shared/ui-queued-bottom-sheet";
import { useTranslation } from "~/context/Locale";
import type { OperationsHistoryDustFilterOption } from "../useOperationsListViewModel";

type Props = Readonly<{
  isOpen: boolean;
  dustFilterOption: OperationsHistoryDustFilterOption | undefined;
  onClose: () => void;
  onToggle: () => void;
  onExport?: () => void;
}>;

export function OperationsHistoryOptionsSheet({
  isOpen,
  dustFilterOption,
  onClose,
  onToggle,
  onExport,
}: Props) {
  const { bottom } = useSafeAreaInsets();
  const { t } = useTranslation();
  if (!dustFilterOption && !onExport) return null;

  return (
    <QueuedBottomSheet
      testID="operations-history-options-sheet"
      isRequestingToBeOpened={isOpen}
      enableDynamicSizing
      onClose={onClose}
    >
      <BottomSheetView style={{ paddingBottom: bottom + 24 }}>
        <BottomSheetHeader />
        {onExport ? (
          <ListItem onPress={onExport} testID="operations-history-export-csv">
            <ListItemLeading>
              <Spot icon={Csv} />
              <ListItemContent>
                <ListItemTitle>{t("operationsList.options.exportCsv.title")}</ListItemTitle>
                <ListItemDescription numberOfLines={2}>
                  {t("operationsList.options.exportCsv.description")}
                </ListItemDescription>
              </ListItemContent>
            </ListItemLeading>
          </ListItem>
        ) : null}
        {dustFilterOption ? (
          <ListItem onPress={onToggle} testID="operations-history-toggle-dust-filter">
            <ListItemLeading>
              <Spot icon={dustFilterOption.Icon} />
              <ListItemContent>
                <ListItemTitle>{dustFilterOption.title}</ListItemTitle>
                <ListItemDescription numberOfLines={2}>
                  {dustFilterOption.description}
                </ListItemDescription>
              </ListItemContent>
            </ListItemLeading>
          </ListItem>
        ) : null}
      </BottomSheetView>
    </QueuedBottomSheet>
  );
}
