import React, { useCallback } from "react";
import Clipboard from "@react-native-clipboard/clipboard";
import { GenericAwarenessModalLayout } from "@ledgerhq/live-common/genericAwarenessModal";
import { Box, Text } from "@ledgerhq/lumen-ui-rnative";
import { Information, Screens, Trash } from "@ledgerhq/lumen-ui-rnative/symbols";
import { useToastsActions } from "~/actions/toast";
import SettingsRow from "~/components/SettingsRow";
import { useTranslation } from "~/context/Locale";
import type { GenericAwarenessModalMobileContentCard } from "~/reducers/genericAwarenessModal";

type GenericAwarenessModalsSectionProps = Readonly<{
  cards: GenericAwarenessModalMobileContentCard[];
  onOpenModal: (campaignId: string) => void;
  onClearLocalCards: () => void;
  onCreateCarousel: () => void;
  onCreateFeatureIntro: () => void;
}>;

const getItemCount = (card: GenericAwarenessModalMobileContentCard) =>
  card.layout === GenericAwarenessModalLayout.Carousel ? card.data.length : card.items.length;

const getEntryTitles = (card: GenericAwarenessModalMobileContentCard) =>
  card.layout === GenericAwarenessModalLayout.Carousel
    ? card.data.map(slide => slide.title)
    : [card.title, ...card.items.map(item => item.title)];

const getTrigger = (card: GenericAwarenessModalMobileContentCard) =>
  card.id.toLowerCase().startsWith("app_start") ? "appStart" : "deeplink";

const getTriggerValue = (card: GenericAwarenessModalMobileContentCard) =>
  getTrigger(card) === "appStart"
    ? "appStart"
    : `ledgerlive://generic-awareness-modal?id=${encodeURIComponent(card.id)}`;

export function GenericAwarenessModalsSection({
  cards,
  onOpenModal,
  onClearLocalCards,
  onCreateCarousel,
  onCreateFeatureIntro,
}: GenericAwarenessModalsSectionProps) {
  const { t } = useTranslation();
  const { pushToast } = useToastsActions();

  const copyTriggerLink = useCallback(
    (card: GenericAwarenessModalMobileContentCard) => {
      const triggerValue = getTriggerValue(card);

      Clipboard.setString(triggerValue);
      pushToast({
        id: `generic-awareness-modal-trigger-${card.id}`,
        type: "success",
        icon: "success",
        title: "Element copied",
      });
    },
    [pushToast],
  );

  return (
    <>
      <Box lx={{ paddingHorizontal: "s24", paddingTop: "s24", paddingBottom: "s8" }}>
        <Text typography="heading4SemiBold" lx={{ color: "base", marginBottom: "s8" }}>
          {t("settings.debug.contentCards.genericAwareness.existingTitle")}
        </Text>
        <Text typography="body2" lx={{ color: "muted" }}>
          {cards.length === 0
            ? t("settings.debug.contentCards.genericAwareness.noExisting")
            : t("settings.debug.contentCards.genericAwareness.existingDescription")}
        </Text>
      </Box>
      {cards.map(card => (
        <SettingsRow
          key={card.id}
          title={card.id}
          desc={
            <Box lx={{ marginTop: "s4" }}>
              <Text typography="body2SemiBold" lx={{ color: "muted" }}>
                {t("settings.debug.contentCards.genericAwareness.layoutLabel")}: {card.layout}
              </Text>
              <Text typography="body2SemiBold" lx={{ color: "muted" }}>
                {t("settings.debug.contentCards.genericAwareness.idLabel")}: {card.id}
              </Text>
              <Text typography="body2SemiBold" lx={{ color: "muted" }}>
                {t("settings.debug.contentCards.genericAwareness.triggerLabel")}:{" "}
                {getTrigger(card) === "appStart"
                  ? t("settings.debug.contentCards.genericAwareness.appStart")
                  : null}
              </Text>
              {getTrigger(card) === "deeplink" ? (
                <Text
                  typography="body2SemiBold"
                  lx={{ color: "base" }}
                  onPress={() => copyTriggerLink(card)}
                >
                  {getTriggerValue(card)}
                </Text>
              ) : null}
              <Text typography="body2SemiBold" lx={{ color: "base", marginTop: "s8" }}>
                {t("settings.debug.contentCards.genericAwareness.entriesLabel", {
                  count: getItemCount(card),
                })}
              </Text>
              {getEntryTitles(card).map((title, index) => (
                <Text
                  key={`${card.id}-${index}-${title}`}
                  typography="body2SemiBold"
                  lx={{ color: "muted" }}
                >
                  {index + 1}.{" "}
                  {title || t("settings.debug.contentCards.genericAwareness.untitledEntry")}
                </Text>
              ))}
            </Box>
          }
          noTextDesc
          iconLeft={<Information size={24} color="base" />}
          onPress={() => onOpenModal(card.id)}
          testID={`debug-generic-awareness-existing-${card.id}`}
        />
      ))}
      {cards.length > 0 ? (
        <SettingsRow
          title={t("settings.debug.contentCards.genericAwareness.clear")}
          desc={t("settings.debug.contentCards.genericAwareness.clearDesc")}
          iconLeft={<Trash size={24} color="base" />}
          onPress={onClearLocalCards}
          testID="debug-generic-awareness-clear"
        />
      ) : null}
      <SettingsRow
        hasBorderTop
        title={t("settings.debug.contentCards.genericAwareness.createCarousel")}
        desc={t("settings.debug.contentCards.genericAwareness.createCarouselDesc")}
        iconLeft={<Screens size={24} color="base" />}
        onPress={onCreateCarousel}
        testID="debug-generic-awareness-create-carousel"
      />
      <SettingsRow
        title={t("settings.debug.contentCards.genericAwareness.createFeatureIntro")}
        desc={t("settings.debug.contentCards.genericAwareness.createFeatureIntroDesc")}
        iconLeft={<Information size={24} color="base" />}
        onPress={onCreateFeatureIntro}
        testID="debug-generic-awareness-create-feature-intro"
      />
    </>
  );
}
