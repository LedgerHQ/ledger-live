import React, { useCallback, useMemo } from "react";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, { runOnJS, useAnimatedStyle, useSharedValue } from "react-native-reanimated";
import {
  Box,
  Button,
  ListItem,
  ListItemContent,
  ListItemLeading,
  ListItemTrailing,
  ListItemTitle,
  Spinner,
  Text,
} from "@ledgerhq/lumen-ui-rnative";
import { MenuBurger } from "@ledgerhq/lumen-ui-rnative/symbols";
import { useTranslation } from "@shared/i18n";
import type { CardAssetRow, CardAssetsManageContentProps } from "./types";

const ROW_HEIGHT = 64;
const DRAG_ACTIVATION_Y = 8;
const DRAG_CANCEL_X = 24;

type ReorderRowProps = Readonly<{
  row: CardAssetRow;
  index: number;
  rows: readonly CardAssetRow[];
  onReorder: CardAssetsManageContentProps["onReorder"];
  onDragActiveChange: (isDragging: boolean) => void;
  isRowReordering: boolean;
  isReordering: boolean;
}>;

/**
 * A pan on the row itself, so the whole list item is the drag target and the burger stays a hint.
 * The row follows the finger; the host is told to hold its scroll still for the length of the drag.
 */
function useRowDrag({
  onDragActiveChange,
  onDragEnd,
  isEnabled,
}: Readonly<{
  onDragActiveChange: (isDragging: boolean) => void;
  onDragEnd: (rowOffset: number) => void;
  isEnabled: boolean;
}>) {
  const dragY = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: dragY.value }],
    // Lifts the row out of the flow of its neighbours while it travels over them.
    zIndex: dragY.value === 0 ? 0 : 1,
  }));

  /* oxlint-disable react/immutability -- a shared value is written from worklets by design */
  const gesture = useMemo(
    () =>
      Gesture.Pan()
        .enabled(isEnabled)
        .activeOffsetY([-DRAG_ACTIVATION_Y, DRAG_ACTIVATION_Y])
        .failOffsetX([-DRAG_CANCEL_X, DRAG_CANCEL_X])
        .onStart(() => {
          runOnJS(onDragActiveChange)(true);
        })
        .onUpdate(event => {
          dragY.value = event.translationY;
        })
        .onEnd(event => {
          runOnJS(onDragEnd)(Math.round(event.translationY / ROW_HEIGHT));
        })
        .onFinalize(() => {
          dragY.value = 0;
          runOnJS(onDragActiveChange)(false);
        }),
    [dragY, isEnabled, onDragActiveChange, onDragEnd],
  );
  /* oxlint-enable react/immutability */

  return { gesture, animatedStyle };
}

function ReorderRow({
  row,
  index,
  rows,
  onReorder,
  onDragActiveChange,
  isRowReordering,
  isReordering,
}: ReorderRowProps) {
  const reorderBy = useCallback(
    (offset: number) => {
      const targetIndex = Math.max(0, Math.min(rows.length - 1, index + offset));
      if (targetIndex !== index) void onReorder(row.id, rows[targetIndex].id);
    },
    [index, onReorder, row.id, rows],
  );
  const { gesture: dragGesture, animatedStyle } = useRowDrag({
    onDragActiveChange,
    onDragEnd: reorderBy,
    isEnabled: !isReordering,
  });

  return (
    <GestureDetector gesture={dragGesture}>
      <Animated.View
        style={animatedStyle}
        testID={`card-asset-drag-row-${row.id}`}
        accessible
        accessibilityRole="adjustable"
        accessibilityLabel={`Drag ${row.name}`}
        accessibilityActions={[
          { name: "decrement", label: "Move up" },
          { name: "increment", label: "Move down" },
        ]}
        onAccessibilityAction={event =>
          reorderBy(event.nativeEvent.actionName === "decrement" ? -1 : 1)
        }
      >
        <ListItem lx={{ backgroundColor: "surface" }}>
          <ListItemLeading>
            <ListItemContent>
              <ListItemTitle>{row.name}</ListItemTitle>
            </ListItemContent>
          </ListItemLeading>
          <ListItemTrailing>
            {isRowReordering ? (
              <Spinner testID={`card-asset-reorder-spinner-${row.id}`} />
            ) : (
              <MenuBurger size={24} color="muted" />
            )}
          </ListItemTrailing>
        </ListItem>
      </Animated.View>
    </GestureDetector>
  );
}

export function CardAssetsManageDrawer({
  rows,
  onAddAsset,
  onReorder,
  onDragActiveChange,
  reorderingAssetId,
}: CardAssetsManageContentProps) {
  const { t } = useTranslation();
  const handleDragActiveChange = useCallback(
    (isDragging: boolean) => onDragActiveChange?.(isDragging),
    [onDragActiveChange],
  );

  return (
    <Box lx={{ gap: "s24", paddingBottom: "s24" }}>
      <Box lx={{ gap: "s8" }}>
        <Text typography="heading3SemiBold" lx={{ color: "base" }}>
          {t("payTab.card.assets.manageDialog.title")}
        </Text>
        <Text typography="body2" lx={{ color: "muted" }}>
          {t("payTab.card.assets.manageDialog.description")}
        </Text>
      </Box>
      <Box
        lx={{
          backgroundColor: "surface",
          borderRadius: "md",
          paddingHorizontal: "s12",
        }}
      >
        {rows.map((row, index) => (
          <ReorderRow
            key={row.id}
            row={row}
            index={index}
            rows={rows}
            onReorder={onReorder}
            onDragActiveChange={handleDragActiveChange}
            isRowReordering={reorderingAssetId === row.id}
            isReordering={reorderingAssetId !== null}
          />
        ))}
      </Box>
      {onAddAsset ? (
        <Box lx={{ alignItems: "center", gap: "s12", paddingTop: "s16" }}>
          <Text typography="body4" lx={{ color: "muted", textAlign: "center" }}>
            {t("payTab.card.assets.manageDialog.addAssetCaption")}
          </Text>
          <Button appearance="base" size="lg" isFull onPress={onAddAsset} testID="card-assets-add">
            {t("payTab.card.assets.manageDialog.addAsset")}
          </Button>
        </Box>
      ) : null}
    </Box>
  );
}
