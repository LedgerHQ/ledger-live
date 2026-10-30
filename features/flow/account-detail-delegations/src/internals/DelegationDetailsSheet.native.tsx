import React from "react";
import {
  BottomSheetHeader,
  BottomSheetScrollView,
  Box,
  Button,
  Tag,
  Text,
} from "@ledgerhq/lumen-ui-rnative";
import { QueuedBottomSheet, useBottomSheetBottomInset } from "@shared/ui-queued-bottom-sheet";
import type {
  DelegationColumn,
  DelegationRow,
} from "../components/AccountDelegations/AccountDelegations.types";
import { displayCell } from "./display";
import { TAG_APPEARANCE } from "./tagAppearance";

const CONTENT_BOTTOM_SPACING = 24;

type Props = Readonly<{
  row: DelegationRow | undefined;
  columns: readonly DelegationColumn[];
  discreet: boolean;
  openValidatorLabel?: string;
  onOpenValidator?: (rowId: string) => void;
  onSelectAction: (rowId: string, actionId: string) => void;
  onClose: () => void;
  testID?: string;
}>;

const SheetContent = ({ children }: Readonly<{ children: React.ReactNode }>) => {
  const bottomInset = useBottomSheetBottomInset();

  return (
    <BottomSheetScrollView
      contentContainerStyle={{ paddingBottom: bottomInset + CONTENT_BOTTOM_SPACING }}
      showsVerticalScrollIndicator={false}
    >
      {children}
    </BottomSheetScrollView>
  );
};

export const DelegationDetailsSheet = ({
  row,
  columns,
  discreet,
  openValidatorLabel,
  onOpenValidator,
  onSelectAction,
  onClose,
  testID,
}: Props) => {
  return (
    <QueuedBottomSheet
      isRequestingToBeOpened={row !== undefined}
      onClose={onClose}
      enableDynamicSizing
      contentHasBottomSpace
      testID={testID}
    >
      {row ? (
        <SheetContent>
          <BottomSheetHeader density="expanded" title={row.validator.name} />
          <Box lx={{ gap: "s12", paddingBottom: "s16" }}>
            {row.status ? (
              <Box lx={{ flexDirection: "row", justifyContent: "space-between" }}>
                <Tag label={row.status.label} appearance={TAG_APPEARANCE[row.status.appearance]} />
                {row.status.tooltip ? (
                  <Text typography="body3" lx={{ color: "muted", flexShrink: 1 }}>
                    {row.status.tooltip}
                  </Text>
                ) : null}
              </Box>
            ) : null}
            {columns.map(({ id, label }) => {
              const cell = row.cells[id];
              if (!cell) return null;
              return (
                <Box
                  key={id}
                  lx={{ flexDirection: "row", justifyContent: "space-between", gap: "s16" }}
                >
                  <Text typography="body2" lx={{ color: "muted" }}>
                    {label}
                  </Text>
                  <Text typography="body2SemiBold" lx={{ color: "base", flexShrink: 1 }}>
                    {displayCell(cell, discreet)}
                  </Text>
                </Box>
              );
            })}
          </Box>
          <Box lx={{ gap: "s12" }}>
            {row.actions.map(({ id, label, disabledReason }) => (
              <Box key={id} lx={{ gap: "s4" }}>
                <Button
                  isFull
                  size="lg"
                  appearance="gray"
                  disabled={disabledReason !== undefined}
                  onPress={
                    disabledReason === undefined ? () => onSelectAction(row.id, id) : undefined
                  }
                  testID={`delegation-row-${row.id}-action-${id}`}
                >
                  {label}
                </Button>
                {disabledReason ? (
                  <Text typography="body3" lx={{ color: "muted" }}>
                    {disabledReason}
                  </Text>
                ) : null}
              </Box>
            ))}
            {openValidatorLabel && onOpenValidator ? (
              <Button
                isFull
                size="lg"
                appearance="no-background"
                onPress={() => onOpenValidator(row.id)}
                testID={`delegation-row-${row.id}-open-validator`}
              >
                {openValidatorLabel}
              </Button>
            ) : null}
          </Box>
        </SheetContent>
      ) : null}
    </QueuedBottomSheet>
  );
};
