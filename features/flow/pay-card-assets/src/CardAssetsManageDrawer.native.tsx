import React, { useMemo } from "react";
import { View, type ViewProps } from "react-native";
import { GestureDetector } from "react-native-gesture-handler";
import Animated, { useAnimatedStyle, withTiming, type SharedValue } from "react-native-reanimated";
import {
  Box,
  Button,
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
import { useListReorder } from "@shared/ui-list-reorder/native";
import type { CardAssetRow } from "./types";

type ReorderableRowProps = ViewProps &
  Readonly<{
    index: number;
    total: number;
    translationY: SharedValue<number>;
    activeOriginalIndex: SharedValue<number>;
    rowHeight: SharedValue<number>;
    isActive: boolean;
  }>;

function ReorderableRow({
  index,
  total,
  translationY,
  activeOriginalIndex,
  rowHeight,
  isActive,
  style,
  children,
  ...props
}: ReorderableRowProps) {
  // Runs entirely on the UI thread: every frame of the drag re-evaluates from `translationY` and
  // `activeOriginalIndex` directly, so the whole preview (the dragged row tracking the finger,
  // every sibling shifting out of its way) never touches React state or the JS thread.
  // oxlint-disable react-hooks/exhaustive-deps
  const animatedStyle = useAnimatedStyle(() => {
    const from = activeOriginalIndex.value;
    const dragging = from !== -1;
    const isSelf = dragging && index === from;

    let shift = 0;
    if (dragging && !isSelf) {
      const steps = Math.round(translationY.value / rowHeight.value);
      const toIndex = Math.max(0, Math.min(total - 1, from + steps));
      if (toIndex > from && index > from && index <= toIndex) shift = -1;
      else if (toIndex < from && index >= toIndex && index < from) shift = 1;
    }

    return {
      transform: [
        { translateY: isSelf ? translationY.value : withTiming(shift * rowHeight.value) },
        { scale: isActive ? 1.03 : 1 },
      ],
      zIndex: isActive ? 1 : 0,
      shadowOpacity: isActive ? 0.16 : 0,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 4 },
      elevation: isActive ? 6 : 0,
    };
    // `translationY`/`activeOriginalIndex` are shared values: reading `.value` inside the worklet
    // body above is what makes this reactive to them. Putting `.value` in this array instead
    // would capture a stale render-time snapshot, not the live UI-thread value.
  }, [index, total, isActive]);
  // oxlint-enable react-hooks/exhaustive-deps

  return (
    <Animated.View {...props} style={[style, animatedStyle]}>
      {/* The row relies on the list container's own rounded corners + clipping while flush with
          its siblings; once it lifts above them it needs its own, or it looks like a bare
          rectangle floating outside the card. */}
      <Box lx={{ borderRadius: "md", overflow: "hidden" }}>{children}</Box>
    </Animated.View>
  );
}

type CardAssetsManageDrawerProps = Readonly<{
  rows: readonly CardAssetRow[];
  onAddAsset?: () => void;
  onMoveAsset: (id: string, toIndex: number) => Promise<void>;
  reorderingAssetId: string | null;
}>;

export function CardAssetsManageDrawer({
  rows,
  onAddAsset,
  onMoveAsset,
  reorderingAssetId,
}: CardAssetsManageDrawerProps) {
  const { t } = useTranslation();
  const rowsById = useMemo(() => new Map(rows.map(row => [row.id, row])), [rows]);
  const ids = useMemo(() => rows.map(row => row.id), [rows]);
  const reorder = useListReorder({
    ids,
    onMove: (id, toIndex) => void onMoveAsset(id, toIndex),
    disabled: reorderingAssetId !== null,
  });

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
        {reorder.order.flatMap(id => {
          const row = rowsById.get(id);
          if (!row) return [];
          const handleProps = reorder.getHandleProps(row.id);
          return (
            <ReorderableRow key={row.id} {...reorder.getRowProps(row.id)}>
              <ListItem lx={{ backgroundColor: "surface" }}>
                <ListItemLeading>
                  <ListItemContent>
                    <ListItemTitle>{row.name}</ListItemTitle>
                  </ListItemContent>
                </ListItemLeading>
                <ListItemTrailing>
                  {reorderingAssetId === row.id ? (
                    <Spinner size={24} testID={`card-asset-reorder-spinner-${row.id}`} />
                  ) : (
                    <GestureDetector gesture={handleProps.gesture}>
                      <View
                        accessible
                        accessibilityRole="button"
                        accessibilityLabel={t("payTab.card.assets.manageDialog.reorder", {
                          asset: row.name,
                        })}
                        accessibilityActions={[...handleProps.accessibilityActions]}
                        accessibilityState={handleProps.accessibilityState}
                        onAccessibilityAction={handleProps.onAccessibilityAction}
                        testID={`card-asset-reorder-handle-${row.id}`}
                      >
                        <MenuBurger size={24} />
                      </View>
                    </GestureDetector>
                  )}
                </ListItemTrailing>
              </ListItem>
            </ReorderableRow>
          );
        })}
      </Box>
      <Text accessibilityLiveRegion="polite" lx={{ position: "absolute", opacity: 0 }}>
        {reorder.announcement}
      </Text>
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
