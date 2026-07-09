import React from "react";
import { useWindowDimensions } from "react-native";
import { GenericAwarenessModalLayout } from "@ledgerhq/live-common/genericAwarenessModal";
import { Box, Button as LumenButton } from "@ledgerhq/lumen-ui-rnative";
import { useTranslation } from "~/context/Locale";
import type {
  GenericAwarenessModalDebugFormValues,
  GenericAwarenessModalDebugItem,
  GenericAwarenessModalDebugTrigger,
} from "~/dynamicContent/buildLocalGenericAwarenessModalCards";
import { GenericAwarenessItemsList } from "./GenericAwarenessItemsList";
import { GenericAwarenessModalField } from "./GenericAwarenessModalField";
import { GenericAwarenessModalPreview } from "./GenericAwarenessModalPreview";
import { GenericAwarenessTriggerSelector } from "./GenericAwarenessTriggerSelector";

type GenericAwarenessModalFormContentProps = Readonly<{
  form: GenericAwarenessModalDebugFormValues;
  maxFeatureIntroItems: number;
  onCreate: () => void;
  onCopyPreview: () => void;
  onChangeField: <Key extends keyof GenericAwarenessModalDebugFormValues>(
    key: Key,
    value: GenericAwarenessModalDebugFormValues[Key],
  ) => void;
  onChangeTrigger: (trigger: GenericAwarenessModalDebugTrigger) => void;
  onAddItem: () => void;
  onRemoveItem: (index: number) => void;
  onChangeItem: (index: number, values: Partial<GenericAwarenessModalDebugItem>) => void;
}>;

export const getGenericAwarenessModalFormTitleKey = (
  layout: GenericAwarenessModalDebugFormValues["layout"],
) => {
  switch (layout) {
    case GenericAwarenessModalLayout.Carousel:
      return "settings.debug.contentCards.genericAwareness.createCarousel";
    case GenericAwarenessModalLayout.Prompt:
      return "settings.debug.contentCards.genericAwareness.createPrompt";
    case GenericAwarenessModalLayout.FeatureIntro:
      return "settings.debug.contentCards.genericAwareness.createFeatureIntro";
  }
};
export function GenericAwarenessModalFormContent({
  form,
  maxFeatureIntroItems,
  onCreate,
  onCopyPreview,
  onChangeField,
  onChangeTrigger,
  onAddItem,
  onRemoveItem,
  onChangeItem,
}: GenericAwarenessModalFormContentProps) {
  const { t } = useTranslation();
  const { width } = useWindowDimensions();
  const isCarousel = form.layout === GenericAwarenessModalLayout.Carousel;
  const isFeatureIntro = form.layout === GenericAwarenessModalLayout.FeatureIntro;
  const isPrompt = form.layout === GenericAwarenessModalLayout.Prompt;
  const shouldShowContentFields = isFeatureIntro || isPrompt;
  const shouldShowItems = !isPrompt;
  const itemLabel = isCarousel
    ? t("settings.debug.contentCards.genericAwareness.slide")
    : t("settings.debug.contentCards.genericAwareness.item");
  const itemWidth = Math.max(width - 72, 280);

  return (
    <Box lx={{ paddingHorizontal: "s24", paddingVertical: "s16" }}>
      <GenericAwarenessModalPreview form={form} />
      <GenericAwarenessTriggerSelector value={form.trigger} onChange={onChangeTrigger} />
      <GenericAwarenessModalField
        label={t("settings.debug.contentCards.genericAwareness.campaignId")}
        value={form.campaignId}
        onChangeText={value => onChangeField("campaignId", value)}
      />
      {shouldShowContentFields ? (
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
            label={t("settings.debug.contentCards.genericAwareness.imageUrlLight")}
            value={form.imageUrlLight}
            onChangeText={value => onChangeField("imageUrlLight", value)}
          />
          <GenericAwarenessModalField
            label={t("settings.debug.contentCards.genericAwareness.imageUrlDark")}
            value={form.imageUrlDark}
            onChangeText={value => onChangeField("imageUrlDark", value)}
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
          {isFeatureIntro ? (
            <>
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
        </>
      ) : null}
      {shouldShowItems ? (
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
      ) : null}
      <Box
        lx={{
          flexDirection: "row",
          flexWrap: "wrap",
          gap: "s8",
          marginTop: "s8",
        }}
      >
        <LumenButton
          appearance="base"
          size="md"
          onPress={onCreate}
          testID="debug-generic-awareness-create"
        >
          {t("settings.debug.contentCards.genericAwareness.create")}
        </LumenButton>
        <LumenButton appearance="gray" size="md" onPress={onCopyPreview}>
          Copy raw JSON
        </LumenButton>
      </Box>
    </Box>
  );
}
