import React, { useCallback, useRef, useState } from "react";
import { Pressable } from "react-native";
import DraggableFlatList, {
  ScaleDecorator,
  ShadowDecorator,
  type DragEndParams,
  type RenderItemParams,
} from "react-native-draggable-flatlist";
import {
  Box,
  ListItem,
  ListItemContent,
  ListItemLeading,
  ListItemTitle,
  ListItemTrailing,
  Spinner,
  Text,
} from "@ledgerhq/lumen-ui-rnative";
import { MenuBurger } from "@ledgerhq/lumen-ui-rnative/symbols";
import { useTranslation } from "@shared/i18n";
import { CardAssetsManageFooter } from "./CardAssetsManageFooter.native";
import type { CardAssetRow } from "./types";

type AssetRowProps = Readonly<{
  row: CardAssetRow;
  showHandle: boolean;
  isDragging: boolean;
  isReordering: boolean;
  reorderLabel: string;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDrag: () => void;
}>;

function AssetRow({
  row,
  showHandle,
  isDragging,
  isReordering,
  reorderLabel,
  onMoveUp,
  onMoveDown,
  onDrag,
}: AssetRowProps) {
  const backgroundColor = isDragging ? "surfacePressed" : "surface";

  return (
    // Gutter + gap outside the scale/shadow: the dragged cell renders full-bleed otherwise.
    <Box lx={{ paddingHorizontal: "s12", paddingBottom: "s2" }}>
      {/* Scale and shadow come from the library's own drag animation, not our state. */}
      <ScaleDecorator activeScale={1.03}>
        <ShadowDecorator opacity={0.16} radius={12} elevation={6}>
          <Box lx={{ backgroundColor, borderRadius: "sm", overflow: "hidden" }}>
            <ListItem lx={{ backgroundColor }}>
              <ListItemLeading>
                <ListItemContent>
                  <ListItemTitle>{row.name}</ListItemTitle>
                </ListItemContent>
              </ListItemLeading>
              {showHandle ? (
                <ListItemTrailing>
                  {isReordering ? (
                    // Matches the handle's padding so the icon doesn't shift on swap.
                    <Box lx={{ padding: "s8" }}>
                      <Spinner size={24} testID={`card-asset-reorder-spinner-${row.id}`} />
                    </Box>
                  ) : (
                    <Pressable
                      accessible
                      accessibilityRole="button"
                      accessibilityLabel={reorderLabel}
                      accessibilityActions={[
                        { name: "decrement", label: "Move up" },
                        { name: "increment", label: "Move down" },
                      ]}
                      onAccessibilityAction={event => {
                        if (event.nativeEvent.actionName === "decrement") onMoveUp();
                        if (event.nativeEvent.actionName === "increment") onMoveDown();
                      }}
                      onLongPress={onDrag}
                      testID={`card-asset-reorder-handle-${row.id}`}
                    >
                      {/* Bigger touch target for the long-press-to-drag gesture. */}
                      <Box lx={{ padding: "s8" }}>
                        <MenuBurger size={24} />
                      </Box>
                    </Pressable>
                  )}
                </ListItemTrailing>
              ) : null}
            </ListItem>
          </Box>
        </ShadowDecorator>
      </ScaleDecorator>
    </Box>
  );
}

type CardAssetsManageDrawerProps = Readonly<{
  rows: readonly CardAssetRow[];
  onAddAsset?: () => void;
  onMoveAsset: (id: string, toIndex: number) => Promise<void>;
  reorderingAssetIds: ReadonlySet<string>;
}>;

export function CardAssetsManageDrawer({
  rows,
  onAddAsset,
  onMoveAsset,
  reorderingAssetIds,
}: CardAssetsManageDrawerProps) {
  const { t } = useTranslation();
  // Bridges the gap between drop and reorderingAssetIds catching up a render later.
  const [releasedId, setReleasedId] = useState<string | null>(null);
  // onRelease fires with the drag's *start* index; this tracks where it's landing.
  const dropTargetIndexRef = useRef<number | null>(null);

  const moveByOffset = useCallback(
    (id: string, offset: number) => {
      const fromIndex = rows.findIndex(row => row.id === id);
      const toIndex = Math.max(0, Math.min(rows.length - 1, fromIndex + offset));
      if (fromIndex >= 0 && fromIndex !== toIndex) void onMoveAsset(id, toIndex);
    },
    [rows, onMoveAsset],
  );

  const renderItem = useCallback(
    ({ item, drag, isActive }: RenderItemParams<CardAssetRow>) => (
      <AssetRow
        row={item}
        showHandle={rows.length > 1}
        isDragging={isActive}
        isReordering={reorderingAssetIds.has(item.id) || releasedId === item.id}
        reorderLabel={t("payTab.card.assets.manageDialog.reorder", { asset: item.name })}
        onMoveUp={() => moveByOffset(item.id, -1)}
        onMoveDown={() => moveByOffset(item.id, 1)}
        onDrag={drag}
      />
    ),
    [rows.length, reorderingAssetIds, releasedId, t, moveByOffset],
  );

  // Stable identity: the library keys its per-cell tracking off this function.
  const keyExtractor = useCallback((row: CardAssetRow) => row.id, []);

  const setDropTargetIndex = useCallback((index: number) => {
    dropTargetIndexRef.current = index;
  }, []);

  const handleRelease = useCallback(
    (index: number) => {
      const willMove = dropTargetIndexRef.current !== index;
      setReleasedId(willMove ? (rows[index]?.id ?? null) : null);
    },
    [rows],
  );

  const handleDragEnd = useCallback(
    ({ data, from, to }: DragEndParams<CardAssetRow>) => {
      const moved = from !== to ? data[to] : undefined;
      if (!moved) {
        setReleasedId(null);
        return;
      }
      void onMoveAsset(moved.id, to).finally(() => setReleasedId(null));
    },
    [onMoveAsset],
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
      <Box lx={{ backgroundColor: "surface", borderRadius: "md" }}>
        <DraggableFlatList
          data={rows as CardAssetRow[]}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          onDragBegin={setDropTargetIndex}
          onPlaceholderIndexChange={setDropTargetIndex}
          onDragEnd={handleDragEnd}
          onRelease={handleRelease}
          // A card links a handful of assets at most, so the list always fits the sheet. Left
          // scrollable it still claims the pan (iOS bounces a list that fits) and the drag never
          // gets it, and its scroll viewport keeps the sheet from sizing to the rows.
          scrollEnabled={false}
        />
      </Box>
      <CardAssetsManageFooter onAddAsset={onAddAsset} />
    </Box>
  );
}
