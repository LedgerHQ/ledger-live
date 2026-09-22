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
import type { CardAssetRow } from "./types";

type AssetRowProps = Readonly<{
  row: CardAssetRow;
  showHandle: boolean;
  isReordering: boolean;
  reorderLabel: string;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDrag: () => void;
}>;

function AssetRow({
  row,
  showHandle,
  isReordering,
  reorderLabel,
  onMoveUp,
  onMoveDown,
  onDrag,
}: AssetRowProps) {
  return (
    // The gutter lives on this outer box, outside the scale/shadow: the library renders the
    // active cell as a free-floating overlay uninset by the list container's own padding, so
    // without its own gutter here it would jump edge-to-edge the moment it lifts.
    <Box lx={{ paddingHorizontal: "s12" }}>
      {/* Scale/shadow give the lifted row the "picked up" feel; both fade back to flat the
          moment it's dropped since they're driven by the library's own active-cell animation,
          not state. */}
      <ScaleDecorator activeScale={1.03}>
        <ShadowDecorator opacity={0.16} radius={12} elevation={6}>
          <Box lx={{ backgroundColor: "surface", borderRadius: "sm", overflow: "hidden" }}>
            <ListItem lx={{ backgroundColor: "surface" }}>
              <ListItemLeading>
                <ListItemContent>
                  <ListItemTitle>{row.name}</ListItemTitle>
                </ListItemContent>
              </ListItemLeading>
              {showHandle ? (
                <ListItemTrailing>
                  {isReordering ? (
                    // Matches the handle's own padding below so swapping between the two doesn't
                    // shift the icon's position.
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
                      {/* Padding grows the actual touch target, not just its hit slop, so the
                          bigger area is what long-presses to start a drag. */}
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
  onMoveAsset: (id: string, toIndex: number) => Promise<void>;
  reorderingAssetIds: ReadonlySet<string>;
}>;

export function CardAssetsManageDrawer({
  rows,
  onMoveAsset,
  reorderingAssetIds,
}: CardAssetsManageDrawerProps) {
  const { t } = useTranslation();
  // DraggableFlatList only calls `onDragEnd` once its own settle-spring animation finishes, well
  // after the finger actually lifts, and clears once `onMoveAsset` fully settles (not right on
  // drop): `reorderingAssetIds` (from the view model) takes a render to catch up, so clearing
  // this immediately would leave a one-frame gap with no spinner showing at all.
  const [releasedId, setReleasedId] = useState<string | null>(null);
  // `onRelease` always fires with the drag's *start* index, before the settle spring resolves
  // where it lands — this tracks the live drop target (seeded by `onDragBegin`, updated by
  // `onPlaceholderIndexChange` as the drag moves) so release can tell a real move from a drop
  // back in the same spot.
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
    ({ item, drag }: RenderItemParams<CardAssetRow>) => (
      <AssetRow
        row={item}
        showHandle={rows.length > 1}
        isReordering={reorderingAssetIds.has(item.id) || releasedId === item.id}
        reorderLabel={t("payTab.card.assets.manageDialog.reorder", { asset: item.name })}
        onMoveUp={() => moveByOffset(item.id, -1)}
        onMoveDown={() => moveByOffset(item.id, 1)}
        onDrag={drag}
      />
    ),
    [rows.length, reorderingAssetIds, releasedId, t, moveByOffset],
  );

  // A stable reference matters here: the library keys its internal per-cell position/measurement
  // tracking off this function's identity in a few places, so a fresh inline arrow every render
  // (as this used to be) made it redo that bookkeeping on every render instead of only when the
  // extraction logic itself changes.
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
      // The library nulls its own `activeKey` the instant `data` changes shape, but defers
      // resetting the shared values that drive cell position to its own `InteractionManager`
      // call — updating `data` (via `onMoveAsset`) synchronously here would race that reset and
      // snap the list to a stale layout for a frame. Yielding a tick is enough to land after it
      // without this row's commit getting stuck behind some *other*, unrelated interaction handle
      // left open elsewhere in the app (InteractionManager waits for every handle, not just this
      // list's).
      setTimeout(() => {
        void onMoveAsset(moved.id, to).finally(() => setReleasedId(null));
      }, 0);
    },
    [onMoveAsset],
  );

  return (
    <Box lx={{ gap: "s24", paddingBottom: "s24", flex: 1 }}>
      <Box lx={{ gap: "s8" }}>
        <Text typography="heading3SemiBold" lx={{ color: "base" }}>
          {t("payTab.card.assets.manageDialog.title")}
        </Text>
        <Text typography="body2" lx={{ color: "muted" }}>
          {t("payTab.card.assets.manageDialog.description")}
        </Text>
      </Box>
      <Box lx={{ backgroundColor: "surface", borderRadius: "md", flex: 1 }}>
        <DraggableFlatList
          data={rows as CardAssetRow[]}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          onDragBegin={setDropTargetIndex}
          onPlaceholderIndexChange={setDropTargetIndex}
          onDragEnd={handleDragEnd}
          onRelease={handleRelease}
          containerStyle={{ flex: 1 }}
          ItemSeparatorComponent={() => <Box lx={{ paddingTop: "s2" }} />}
        />
      </Box>
    </Box>
  );
}
