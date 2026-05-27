import React from "react";
import { StyleSheet, useWindowDimensions } from "react-native";
import { GenericAwarenessModalLayout } from "@ledgerhq/live-common/genericAwarenessModal";
import {
  BottomSheetHeader,
  BottomSheetScrollView,
  Box,
  Button as LumenButton,
} from "@ledgerhq/lumen-ui-rnative";
import QueuedDrawerBottomSheet from "LLM/components/QueuedDrawer/QueuedDrawerBottomSheet";
import { useTranslation } from "~/context/Locale";
import type {
  GenericAwarenessModalDebugFormValues,
  GenericAwarenessModalDebugItem,
  GenericAwarenessModalDebugTrigger,
} from "~/dynamicContent/buildLocalGenericAwarenessModalCards";
import { GenericAwarenessItemsList } from "./GenericAwarenessItemsList";
import { GenericAwarenessModalField } from "./GenericAwarenessModalField";
import { GenericAwarenessTriggerSelector } from "./GenericAwarenessTriggerSelector";

type GenericAwarenessModalFormSheetProps = Readonly<{
  form: GenericAwarenessModalDebugFormValues;
  isOpen: boolean;
  maxFeatureIntroItems: number;
  onClose: () => void;
  onCreate: () => void;
  onChangeField: <Key extends keyof GenericAwarenessModalDebugFormValues>(
    key: Key,
    value: GenericAwarenessModalDebugFormValues[Key],
  ) => void;
  onChangeTrigger: (trigger: GenericAwarenessModalDebugTrigger) => void;
  onAddItem: () => void;
  onRemoveItem: (index: number) => void;
  onChangeItem: (index: number, values: Partial<GenericAwarenessModalDebugItem>) => void;
}>;

export function GenericAwarenessModalFormSheet({
  form,
  isOpen,
  maxFeatureIntroItems,
  onClose,
  onCreate,
  onChangeField,
  onChangeTrigger,
  onAddItem,
  onRemoveItem,
  onChangeItem,
}: GenericAwarenessModalFormSheetProps) {
  const { t } = useTranslation();
  const { width } = useWindowDimensions();
  const isCarousel = form.layout === GenericAwarenessModalLayout.Carousel;
  const isFeatureIntro = form.layout === GenericAwarenessModalLayout.FeatureIntro;
  const itemLabel = isCarousel
    ? t("settings.debug.contentCards.genericAwareness.slide")
    : t("settings.debug.contentCards.genericAwareness.item");
  const itemWidth = Math.max(width - 72, 280);

  return (
    <QueuedDrawerBottomSheet
      isRequestingToBeOpened={isOpen}
      onClose={onClose}
      snapPoints={["92%"]}
      enablePanDownToClose
    >
      <BottomSheetHeader
        title={
          isCarousel
            ? t("settings.debug.contentCards.genericAwareness.createCarousel")
            : t("settings.debug.contentCards.genericAwareness.createFeatureIntro")
        }
        spacing
        density="expanded"
      />
      <BottomSheetScrollView
        contentContainerStyle={styles.drawerContent}
        keyboardShouldPersistTaps="handled"
      >
        <GenericAwarenessTriggerSelector value={form.trigger} onChange={onChangeTrigger} />
        <GenericAwarenessModalField
          label={t("settings.debug.contentCards.genericAwareness.campaignId")}
          value={form.campaignId}
          onChangeText={value => onChangeField("campaignId", value)}
        />
        {isFeatureIntro ? (
          <>
            <GenericAwarenessModalField
              label={t("settings.debug.contentCards.genericAwareness.titleField")}
              value={form.title}
              onChangeText={value => onChangeField("title", value)}
            />
            <GenericAwarenessModalField
              label={t("settings.debug.contentCards.genericAwareness.subtitle")}
              value={form.subtitle}
              onChangeText={value => onChangeField("subtitle", value)}
              multiline
            />
            <GenericAwarenessModalField
              label={t("settings.debug.contentCards.genericAwareness.imageUrl")}
              value={form.imageUrl}
              onChangeText={value => onChangeField("imageUrl", value)}
            />
            <GenericAwarenessModalField
              label={t("settings.debug.contentCards.genericAwareness.primaryButtonLabel")}
              value={form.primaryButtonLabel}
              onChangeText={value => onChangeField("primaryButtonLabel", value)}
            />
            <GenericAwarenessModalField
              label={t("settings.debug.contentCards.genericAwareness.primaryButtonLink")}
              value={form.primaryButtonLink}
              onChangeText={value => onChangeField("primaryButtonLink", value)}
            />
            <GenericAwarenessModalField
              label={t("settings.debug.contentCards.genericAwareness.secondaryButtonLabel")}
              value={form.secondaryButtonLabel}
              onChangeText={value => onChangeField("secondaryButtonLabel", value)}
            />
            <GenericAwarenessModalField
              label={t("settings.debug.contentCards.genericAwareness.secondaryButtonLink")}
              value={form.secondaryButtonLink}
              onChangeText={value => onChangeField("secondaryButtonLink", value)}
            />
          </>
        ) : null}
        <GenericAwarenessItemsList
          items={form.items}
          itemLabel={itemLabel}
          itemWidth={itemWidth}
          isCarousel={isCarousel}
          maxItems={isCarousel ? undefined : maxFeatureIntroItems}
          onAddItem={onAddItem}
          onRemoveItem={onRemoveItem}
          onChangeItem={onChangeItem}
        />
        <Box lx={{ marginTop: "s16", marginBottom: "s24" }}>
          <LumenButton
            appearance="accent"
            size="md"
            onPress={onCreate}
            testID="debug-generic-awareness-create"
            isFull
          >
            {t("settings.debug.contentCards.genericAwareness.create")}
          </LumenButton>
        </Box>
      </BottomSheetScrollView>
    </QueuedDrawerBottomSheet>
  );
}

const styles = StyleSheet.create({
  drawerContent: {
    paddingBottom: 24,
  },
});
