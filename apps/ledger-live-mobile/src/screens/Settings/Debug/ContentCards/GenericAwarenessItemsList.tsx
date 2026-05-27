import React, { useCallback, useRef } from "react";
import { FlatList } from "react-native";
import { Box, Button as LumenButton, IconButton, Text } from "@ledgerhq/lumen-ui-rnative";
import { Close } from "@ledgerhq/lumen-ui-rnative/symbols";
import { useTranslation } from "~/context/Locale";
import type { GenericAwarenessModalDebugItem } from "~/dynamicContent/buildLocalGenericAwarenessModalCards";
import { GenericAwarenessModalField } from "./GenericAwarenessModalField";

type GenericAwarenessItemsListProps = Readonly<{
  items: GenericAwarenessModalDebugItem[];
  itemLabel: string;
  itemWidth: number;
  isCarousel: boolean;
  maxItems?: number;
  onAddItem: () => void;
  onRemoveItem: (index: number) => void;
  onChangeItem: (index: number, values: Partial<GenericAwarenessModalDebugItem>) => void;
}>;

export function GenericAwarenessItemsList({
  items,
  itemLabel,
  itemWidth,
  isCarousel,
  maxItems,
  onAddItem,
  onRemoveItem,
  onChangeItem,
}: GenericAwarenessItemsListProps) {
  const listRef = useRef<FlatList<GenericAwarenessModalDebugItem | null>>(null);
  const canAddItem = maxItems == null || items.length < maxItems;
  const data = canAddItem ? [...items, null] : items;

  const handleAddItem = useCallback(() => {
    if (canAddItem) {
      const nextIndex = items.length;
      onAddItem();
      requestAnimationFrame(() => {
        listRef.current?.scrollToIndex({
          index: nextIndex,
          animated: true,
        });
      });
    }
  }, [canAddItem, items.length, onAddItem]);

  return (
    <FlatList
      ref={listRef}
      data={data}
      horizontal
      keyExtractor={(item, index) => (item ? `${itemLabel}-${index}` : `${itemLabel}-add`)}
      keyboardShouldPersistTaps="handled"
      showsHorizontalScrollIndicator={false}
      snapToInterval={itemWidth + 16}
      decelerationRate="fast"
      getItemLayout={(_, index) => ({
        length: itemWidth + 16,
        offset: (itemWidth + 16) * index,
        index,
      })}
      onScrollToIndexFailed={() => {
        listRef.current?.scrollToEnd({ animated: true });
      }}
      renderItem={({ item, index }) =>
        item ? (
          <GenericAwarenessItemCard
            item={item}
            index={index}
            itemLabel={itemLabel}
            width={itemWidth}
            isCarousel={isCarousel}
            canRemove={items.length > 1}
            onChange={onChangeItem}
            onRemove={onRemoveItem}
          />
        ) : (
          <GenericAwarenessAddItemCard
            itemLabel={itemLabel}
            width={itemWidth}
            onPress={handleAddItem}
          />
        )
      }
    />
  );
}

type GenericAwarenessAddItemCardProps = Readonly<{
  itemLabel: string;
  width: number;
  onPress: () => void;
}>;

function GenericAwarenessAddItemCard({
  itemLabel,
  width,
  onPress,
}: GenericAwarenessAddItemCardProps) {
  const { t } = useTranslation();

  return (
    <Box
      lx={{
        borderWidth: "s1",
        borderColor: "muted",
        borderRadius: "sm",
        padding: "s16",
        marginRight: "s16",
        marginBottom: "s16",
        alignItems: "center",
        justifyContent: "center",
      }}
      style={{ width }}
    >
      <LumenButton
        appearance="base"
        size="md"
        onPress={onPress}
        testID="debug-generic-awareness-add-item"
      >
        {t("settings.debug.contentCards.genericAwareness.addItem", {
          item: itemLabel,
        })}
      </LumenButton>
    </Box>
  );
}

type GenericAwarenessItemCardProps = Readonly<{
  item: GenericAwarenessModalDebugItem;
  index: number;
  itemLabel: string;
  width: number;
  isCarousel: boolean;
  canRemove: boolean;
  onChange: (index: number, values: Partial<GenericAwarenessModalDebugItem>) => void;
  onRemove: (index: number) => void;
}>;

function GenericAwarenessItemCard({
  item,
  index,
  itemLabel,
  width,
  isCarousel,
  canRemove,
  onChange,
  onRemove,
}: GenericAwarenessItemCardProps) {
  const { t } = useTranslation();

  return (
    <Box
      lx={{
        borderWidth: "s1",
        borderColor: "muted",
        borderRadius: "sm",
        padding: "s16",
        marginRight: "s16",
        marginBottom: "s16",
      }}
      style={{ width }}
    >
      <Box
        lx={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "s12",
        }}
      >
        <Text typography="body1SemiBold" lx={{ color: "base" }}>
          {itemLabel} {index + 1}
        </Text>
        {canRemove ? (
          <IconButton
            appearance="no-background"
            size="sm"
            icon={Close}
            onPress={() => onRemove(index)}
            testID={`debug-generic-awareness-remove-item-${index}`}
            accessibilityLabel="Remove item"
          />
        ) : null}
      </Box>
      <GenericAwarenessModalField
        label={t("settings.debug.contentCards.genericAwareness.titleField")}
        value={item.title}
        onChangeText={value => onChange(index, { title: value })}
      />
      <GenericAwarenessModalField
        label={t("settings.debug.contentCards.genericAwareness.subtitle")}
        value={item.subtitle}
        onChangeText={value => onChange(index, { subtitle: value })}
        multiline
      />
      {isCarousel ? (
        <>
          <GenericAwarenessModalField
            label={t("settings.debug.contentCards.genericAwareness.imageUrl")}
            value={item.imageUrl ?? ""}
            onChangeText={value => onChange(index, { imageUrl: value })}
          />
          <GenericAwarenessModalField
            label={t("settings.debug.contentCards.genericAwareness.primaryButtonLabel")}
            value={item.primaryButtonLabel ?? ""}
            onChangeText={value => onChange(index, { primaryButtonLabel: value })}
          />
          <GenericAwarenessModalField
            label={t("settings.debug.contentCards.genericAwareness.primaryButtonLink")}
            value={item.primaryButtonLink ?? ""}
            onChangeText={value => onChange(index, { primaryButtonLink: value })}
          />
        </>
      ) : (
        <GenericAwarenessModalField
          label={t("settings.debug.contentCards.genericAwareness.icon")}
          value={item.icon ?? ""}
          onChangeText={value => onChange(index, { icon: value })}
        />
      )}
    </Box>
  );
}

